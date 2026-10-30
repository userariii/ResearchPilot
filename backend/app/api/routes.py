import asyncio
import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import StreamingResponse, PlainTextResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.session import ResearchSession
from backend.app.models.source import ResearchSource
from backend.app.schemas.research import (
    ResearchCreate,
    ResearchSessionRead,
    ResearchSessionSummary,
    FollowUpRequest,
    FollowUpResponse,
    SystemStatus,
)
from backend.app.services.research_agent import ResearchAgent
from backend.app.services.ai_service import get_ai_service
from backend.app.services.report_service import ReportService
from backend.app.utils.event_manager import event_manager
from backend.app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Research"])


@router.get("/health", summary="Health check endpoint")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


@router.get("/system/status", response_model=SystemStatus, summary="Check configured AI and Search providers")
async def system_status(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.query(ResearchSession).first()
    except Exception:
        db_ok = False

    return SystemStatus(
        ai_provider=settings.get_effective_ai_provider(),
        search_provider=settings.get_effective_search_provider(),
        gemini_configured=bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip()),
        openai_configured=bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip()),
        tavily_configured=bool(settings.TAVILY_API_KEY and settings.TAVILY_API_KEY.strip()),
        database_ok=db_ok
    )


@router.post("/research", response_model=ResearchSessionRead, status_code=status.HTTP_201_CREATED, summary="Start a new autonomous research task")
async def create_research(
    payload: ResearchCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Create persistent session record
    session = ResearchSession(
        topic=payload.topic.strip(),
        instructions=payload.instructions.strip() if payload.instructions else None,
        research_depth=payload.research_depth,
        status="pending"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Launch agent workflow in background
    agent = ResearchAgent()
    background_tasks.add_task(agent.run, session.id)

    return session


@router.get("/research", response_model=List[ResearchSessionSummary], summary="List all past research sessions")
async def list_research(db: Session = Depends(get_db)):
    sessions = (
        db.query(ResearchSession)
        .order_by(desc(ResearchSession.created_at))
        .all()
    )
    results = []
    for s in sessions:
        results.append(
            ResearchSessionSummary(
                id=s.id,
                topic=s.topic,
                instructions=s.instructions,
                research_depth=s.research_depth,
                status=s.status,
                error_message=s.error_message,
                created_at=s.created_at,
                updated_at=s.updated_at,
                sources_count=len(s.sources),
                has_report=bool(s.report and s.report.strip())
            )
        )
    return results


@router.get("/research/{session_id}", response_model=ResearchSessionRead, summary="Get full details of a research session")
async def get_research(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")
    return session


@router.get("/research/{session_id}/events", summary="Stream real-time research progress via Server-Sent Events (SSE)")
async def stream_research_events(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")

    queue = await event_manager.subscribe(session_id)

    async def event_generator():
        try:
            # Flush initial SSE connection as an SSE keep-alive comment so it doesn't emit raw noise to the user log
            yield ": connected\n\n"

            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"data: {json.dumps(event)}\n\n"
                    # If completed or failed, we can still stay open briefly or let client close
                    if event.get("type") in ("completed", "failed"):
                        await asyncio.sleep(1.0)
                except asyncio.TimeoutError:
                    # Keep-alive ping
                    yield f": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await event_manager.unsubscribe(session_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/research/{session_id}/export", summary="Export generated research report as Markdown")
async def export_research_report(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")
    if not session.report:
        raise HTTPException(status_code=400, detail="Research report has not been generated yet")

    sources_data = [
        {"title": s.title, "url": s.url, "domain": s.domain, "snippet": s.snippet}
        for s in session.sources
    ]

    export_content = ReportService.format_export_markdown(
        session_topic=session.topic,
        report_text=session.report,
        sources=sources_data,
        created_at=session.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
    )

    clean_filename = "".join(c for c in session.topic[:40] if c.isalnum() or c in ("-", "_")).rstrip()
    if not clean_filename:
        clean_filename = f"research-report-{session.id[:8]}"
    filename = f"{clean_filename}.md"

    return PlainTextResponse(
        content=export_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.delete("/research/{session_id}", summary="Delete a research session")
async def delete_research(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")

    event_manager.clear_session(session_id)
    db.delete(session)
    db.commit()
    return {"message": "Research session successfully deleted", "id": session_id}


@router.post("/research/{session_id}/follow-up", response_model=FollowUpResponse, summary="Ask a grounded follow-up question")
async def answer_follow_up(
    session_id: str,
    payload: FollowUpRequest,
    db: Session = Depends(get_db)
):
    session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")
    if not session.report:
        raise HTTPException(status_code=400, detail="Report is not yet completed for this research session")

    sources_data = [
        {"title": s.title, "url": s.url, "domain": s.domain, "snippet": s.snippet}
        for s in session.sources
    ]

    ai_service = get_ai_service()
    answer_text = await ai_service.answer_follow_up(
        question=payload.question,
        report=session.report,
        sources=sources_data
    )

    referenced = [s.title for s in session.sources[:5]]

    return FollowUpResponse(
        question=payload.question,
        answer=answer_text,
        referenced_sources=referenced
    )


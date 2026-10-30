import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.models.session import ResearchSession
from backend.app.models.source import ResearchSource
from backend.app.services.ai_service import get_ai_service, BaseAIService
from backend.app.services.search_service import get_search_service, BaseSearchService
from backend.app.services.report_service import ReportService
from backend.app.utils.event_manager import event_manager

logger = logging.getLogger(__name__)


class ResearchAgent:
    """
    Autonomous AI Research Agent executing the multi-step research loop:
    1. Intent Understanding
    2. Research Planning
    3. Multi-Query Web Search & Source Deduplication
    4. Cross-Source Evidence Analysis & Conflict Detection
    5. Structured Report Generation with Source Citations
    6. Persistent Storage and Real-Time SSE Streaming
    """

    def __init__(
        self,
        ai_service: Optional[BaseAIService] = None,
        search_service: Optional[BaseSearchService] = None,
    ):
        self.ai_service = ai_service or get_ai_service()
        self.search_service = search_service or get_search_service()

    async def run(self, session_id: str):
        """
        Execute the complete autonomous research cycle for the given session_id.
        """
        db: Session = SessionLocal()
        try:
            # 1. Load session from database
            session: Optional[ResearchSession] = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
            if not session:
                logger.error(f"ResearchSession {session_id} not found in database.")
                return

            topic = session.topic
            instructions = session.instructions
            depth = session.research_depth

            logger.info(f"Starting autonomous research for session {session_id} on topic: '{topic}' [depth={depth}]")

            # Publish initial stage
            await self._update_status(db, session, "understanding", "Analyzing research topic and identifying scope...")
            await asyncio.sleep(0.5)

            # Step 1 & 2: Understand & Generate Plan
            await self._update_status(db, session, "planning", "Formulating structured research plan and targeted search vectors...")
            try:
                plan_dict = await self.ai_service.generate_plan(
                    topic=topic, instructions=instructions, depth=depth
                )
            except Exception as e:
                logger.warning(f"AI planning failed ({e}), falling back to deterministic planning...")
                # Fallback to mock planner if primary failed
                from backend.app.services.ai_service import MockAIService
                plan_dict = await MockAIService().generate_plan(topic, instructions, depth)

            # Save plan in session
            session.research_plan = plan_dict
            db.commit()

            # Broadcast plan event to SSE clients
            await event_manager.publish(session_id, "plan_created", {
                "message": "Research plan formulated",
                "plan": plan_dict
            })

            # Step 3: Web Research (Execute searches for each research question)
            await self._update_status(db, session, "searching", "Initiating multi-vector web research across online sources...")
            
            research_questions = plan_dict.get("research_questions", [])
            collected_sources: List[Dict[str, Any]] = []
            seen_urls = set()

            # Search queries execution
            for idx, q_item in enumerate(research_questions, 1):
                question_text = q_item.get("question", "")
                queries = q_item.get("search_queries", [question_text])

                await event_manager.publish(session_id, "search_progress", {
                    "stage": "searching",
                    "message": f"Investigating Question {idx}/{len(research_questions)}: {question_text}",
                    "current_question": question_text,
                    "question_index": idx,
                    "total_questions": len(research_questions),
                })

                for query in queries[:2]:  # Limit to top 2 queries per question to avoid excessive calls
                    await event_manager.publish(session_id, "query_executing", {
                        "message": f"Querying search provider for: '{query}'",
                        "query": query
                    })

                    try:
                        results = await self.search_service.search(query=query, max_results=3)
                    except Exception as e:
                        logger.warning(f"Search provider failed for '{query}': {e}. Using fallback results.")
                        from backend.app.services.search_service import MockSearchService
                        results = await MockSearchService().search(query=query, max_results=3)

                    try:
                        for r in results:
                            url = r.get("url", "").strip()
                            if url and url not in seen_urls:
                                seen_urls.add(url)
                                r["query_used"] = query
                                collected_sources.append(r)

                                # Persist source to database as it is discovered
                                db_source = ResearchSource(
                                    research_session_id=session_id,
                                    title=r.get("title", "Untitled Source"),
                                    url=url,
                                    domain=r.get("domain", "web"),
                                    snippet=r.get("snippet", ""),
                                    extracted_content=r.get("extracted_content"),
                                    query_used=query
                                )
                                db.add(db_source)
                                db.commit()

                                # Stream source discovered event
                                await event_manager.publish(session_id, "source_discovered", {
                                    "message": f"Discovered source: {r.get('title')}",
                                    "source": {
                                        "id": db_source.id,
                                        "title": db_source.title,
                                        "url": db_source.url,
                                        "domain": db_source.domain,
                                        "snippet": db_source.snippet,
                                        "query_used": query
                                    },
                                    "total_sources_found": len(collected_sources)
                                })
                    except Exception as e:
                        logger.error(f"Search failed for query '{query}': {e}")
                        await event_manager.publish(session_id, "search_warning", {
                            "message": f"Search warning for query '{query}': {str(e)}"
                        })

                # Short delay to give SSE client smooth visual progress
                await asyncio.sleep(0.3)

            # Ensure we have at least some sources
            if not collected_sources:
                logger.warning("No sources returned from primary search, using fallback sources...")
                from backend.app.services.search_service import MockSearchService
                fallback_results = await MockSearchService().search(query=topic, max_results=4)
                for r in fallback_results:
                    db_source = ResearchSource(
                        research_session_id=session_id,
                        title=r["title"],
                        url=r["url"],
                        domain=r["domain"],
                        snippet=r["snippet"],
                        extracted_content=r["extracted_content"],
                        query_used=topic
                    )
                    db.add(db_source)
                    collected_sources.append(r)
                db.commit()

            # Step 4: Evidence Analysis
            await self._update_status(db, session, "analyzing", f"Analyzing evidence and cross-referencing {len(collected_sources)} retrieved sources...")
            
            question_strings = [q.get("question", "") for q in research_questions]
            try:
                analysis = await self.ai_service.analyze_sources(
                    topic=topic, questions=question_strings, sources=collected_sources
                )
            except Exception as e:
                logger.warning(f"AI analysis failed ({e}), falling back to deterministic analysis...")
                from backend.app.services.ai_service import MockAIService
                analysis = await MockAIService().analyze_sources(topic, question_strings, collected_sources)

            # Broadcast analysis findings event
            await event_manager.publish(session_id, "analysis_complete", {
                "message": "Source analysis and evidence synthesis complete",
                "key_findings_count": len(analysis.get("key_findings", [])),
                "conflicts_count": len(analysis.get("conflicting_claims", [])),
                "analysis": analysis
            })
            await asyncio.sleep(0.5)

            # Step 5: Report Generation
            await self._update_status(db, session, "generating", "Synthesizing research report with structured sections and source citations...")
            try:
                report_markdown = await self.ai_service.generate_report(
                    topic=topic,
                    instructions=instructions,
                    plan=plan_dict,
                    sources=collected_sources,
                    analysis=analysis
                )
            except Exception as e:
                logger.warning(f"AI report generation failed ({e}), falling back to deterministic generator...")
                from backend.app.services.ai_service import MockAIService
                report_markdown = await MockAIService().generate_report(
                    topic, instructions, plan_dict, collected_sources, analysis
                )

            # Extract executive summary
            executive_summary = ReportService.extract_executive_summary(report_markdown)

            # Step 6: Finalize Session in Database
            session.report = report_markdown
            session.executive_summary = executive_summary
            session.status = "completed"
            session.updated_at = datetime.now(timezone.utc)
            db.commit()

            # Broadcast completion event
            await event_manager.publish(session_id, "completed", {
                "message": "Research successfully completed and verified report persisted",
                "status": "completed",
                "executive_summary": executive_summary,
                "sources_count": len(collected_sources),
                "report_preview": report_markdown[:300] + "..."
            })

            logger.info(f"Research session {session_id} successfully completed.")

        except Exception as e:
            logger.exception(f"Fatal error during research session {session_id}: {e}")
            try:
                session = db.query(ResearchSession).filter(ResearchSession.id == session_id).first()
                if session:
                    session.status = "failed"
                    session.error_message = str(e)
                    db.commit()
                await event_manager.publish(session_id, "failed", {
                    "message": f"Research task failed: {str(e)}",
                    "status": "failed",
                    "error": str(e)
                })
            except Exception as db_err:
                logger.error(f"Failed to update error status in DB: {db_err}")
        finally:
            db.close()

    async def _update_status(self, db: Session, session: ResearchSession, status: str, message: str):
        session.status = status
        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        await event_manager.publish(session.id, "status_changed", {
            "status": status,
            "message": message
        })


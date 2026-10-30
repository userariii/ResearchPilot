import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class ResearchSource(Base):
    __tablename__ = "research_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_session_id = Column(String(36), ForeignKey("research_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False)
    domain = Column(String(255), nullable=False)
    snippet = Column(Text, nullable=False)
    extracted_content = Column(Text, nullable=True)
    relevance_score = Column(Integer, default=100)
    relevance_explanation = Column(Text, nullable=True)
    query_used = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("ResearchSession", back_populates="sources")


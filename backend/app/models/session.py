import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class ResearchSession(Base):
    __tablename__ = "research_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic = Column(String(500), nullable=False)
    instructions = Column(Text, nullable=True)
    research_depth = Column(String(20), nullable=False, default="standard")  # quick, standard, deep
    status = Column(String(30), nullable=False, default="pending")  # pending, planning, searching, analyzing, generating, completed, failed
    error_message = Column(Text, nullable=True)
    research_plan = Column(JSON, nullable=True)  # List of research questions, objectives, search queries
    report = Column(Text, nullable=True)  # Final structured markdown report
    executive_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    sources = relationship("ResearchSource", back_populates="session", cascade="all, delete-orphan", lazy="joined")


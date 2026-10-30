from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator, ConfigDict


class ResearchCreate(BaseModel):
    topic: str = Field(..., min_length=3, max_length=500, description="The research topic or question")
    instructions: Optional[str] = Field(None, max_length=2000, description="Optional extra instructions or focus areas")
    research_depth: str = Field("standard", description="Research depth: quick, standard, or deep")

    @field_validator("research_depth")
    @classmethod
    def validate_depth(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ("quick", "standard", "deep"):
            raise ValueError("research_depth must be one of: 'quick', 'standard', 'deep'")
        return v

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("topic cannot be empty")
        return v


class ResearchQuestion(BaseModel):
    question: str
    search_queries: List[str]
    rationale: Optional[str] = None


class ResearchPlan(BaseModel):
    objective: str
    target_domains_or_types: List[str] = []
    research_questions: List[ResearchQuestion]
    methodology: Optional[str] = None


class ResearchSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    research_session_id: str
    title: str
    url: str
    domain: str
    snippet: str
    extracted_content: Optional[str] = None
    relevance_score: Optional[int] = 100
    relevance_explanation: Optional[str] = None
    query_used: Optional[str] = None
    created_at: datetime


class ResearchSessionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    topic: str
    instructions: Optional[str] = None
    research_depth: str
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    sources_count: int = 0
    has_report: bool = False


class ResearchSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    topic: str
    instructions: Optional[str] = None
    research_depth: str
    status: str
    error_message: Optional[str] = None
    research_plan: Optional[Dict[str, Any]] = None
    report: Optional[str] = None
    executive_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    sources: List[ResearchSourceRead] = []


class FollowUpRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000, description="Follow-up question about the research")


class FollowUpResponse(BaseModel):
    question: str
    answer: str
    referenced_sources: List[str] = []


class SystemStatus(BaseModel):
    ai_provider: str
    search_provider: str
    gemini_configured: bool
    openai_configured: bool
    tavily_configured: bool
    database_ok: bool

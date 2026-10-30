import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "ResearchPilot API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite:///./research_pilot.db"

    # AI Configuration
    AI_PROVIDER: str = "auto"  # 'auto', 'ensemble', 'gemini', 'openai', 'mock'
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash, gemini-3.8-flash"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini, gpt-4o"
    OPENAI_BASE_URL: Optional[str] = None

    # Search Configuration
    SEARCH_PROVIDER: str = "auto"  # 'tavily', 'mock', or 'auto'
    TAVILY_API_KEY: Optional[str] = None
    MAX_SEARCH_RESULTS_PER_QUERY: int = 5

    # Research Execution Limits
    MAX_TOPIC_LENGTH: int = 500
    MAX_INSTRUCTIONS_LENGTH: int = 2000
    MAX_CONTENT_SNIPPET_LENGTH: int = 2500
    REQUEST_TIMEOUT_SECONDS: int = 45

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

    def get_gemini_models(self) -> List[str]:
        if not self.GEMINI_MODEL:
            return ["gemini-3.5-flash"]
        models = [m.strip() for m in self.GEMINI_MODEL.split(",") if m.strip()]
        return models or ["gemini-3.5-flash"]

    def get_openai_models(self) -> List[str]:
        if not self.OPENAI_MODEL:
            return ["gpt-4o-mini"]
        models = [m.strip() for m in self.OPENAI_MODEL.split(",") if m.strip()]
        return models or ["gpt-4o-mini"]

    def get_effective_ai_provider(self) -> str:
        if self.AI_PROVIDER in ("ensemble", "mix", "hybrid"):
            return "ensemble"
        if self.AI_PROVIDER != "auto":
            return self.AI_PROVIDER.lower()
        # If both are present, we can run in ensemble mode
        has_gemini = bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip())
        has_openai = bool(self.OPENAI_API_KEY and self.OPENAI_API_KEY.strip())
        if has_gemini and has_openai:
            return "ensemble"
        if has_gemini:
            return "gemini"
        if has_openai:
            return "openai"
        return "mock"

    def get_effective_search_provider(self) -> str:
        if self.SEARCH_PROVIDER != "auto":
            return self.SEARCH_PROVIDER.lower()
        if self.TAVILY_API_KEY and self.TAVILY_API_KEY.strip():
            return "tavily"
        return "mock"


settings = Settings()


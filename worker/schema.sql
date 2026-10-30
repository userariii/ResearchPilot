-- ResearchPilot Cloudflare D1 Database Schema
-- Provides persistent SQLite storage on Cloudflare's Edge Network

CREATE TABLE IF NOT EXISTS research_sessions (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    instructions TEXT,
    research_depth TEXT NOT NULL DEFAULT 'standard',
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    research_plan TEXT, -- JSON-stringified ResearchPlan
    report TEXT,        -- Synthesized Markdown report
    executive_summary TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_sources (
    id TEXT PRIMARY KEY,
    research_session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    snippet TEXT NOT NULL,
    extracted_content TEXT,
    relevance_score INTEGER DEFAULT 100,
    relevance_explanation TEXT,
    query_used TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (research_session_id) REFERENCES research_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS research_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT NOT NULL, -- JSON-stringified LiveAgentEvent
    created_at TEXT NOT NULL
);

-- Indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_research_sessions_created ON research_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_sources_session ON research_sources(research_session_id);
CREATE INDEX IF NOT EXISTS idx_research_events_session_id ON research_events(session_id, id ASC);


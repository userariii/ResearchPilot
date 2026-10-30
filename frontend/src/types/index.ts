export type ResearchDepth = 'quick' | 'standard' | 'deep';

export type ResearchStatus =
  | 'pending'
  | 'understanding'
  | 'planning'
  | 'searching'
  | 'analyzing'
  | 'generating'
  | 'completed'
  | 'failed';

export interface ResearchQuestion {
  question: string;
  search_queries: string[];
  rationale?: string;
}

export interface ResearchPlan {
  objective: string;
  methodology?: string;
  target_domains_or_types?: string[];
  research_questions: ResearchQuestion[];
}

export interface ResearchSource {
  id: string;
  research_session_id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  extracted_content?: string | null;
  relevance_score?: number | null;
  relevance_explanation?: string | null;
  query_used?: string | null;
  created_at: string;
}

export interface ResearchSession {
  id: string;
  topic: string;
  instructions?: string | null;
  research_depth: ResearchDepth;
  status: ResearchStatus;
  error_message?: string | null;
  research_plan?: ResearchPlan | null;
  report?: string | null;
  executive_summary?: string | null;
  created_at: string;
  updated_at: string;
  sources: ResearchSource[];
}

export interface ResearchSessionSummary {
  id: string;
  topic: string;
  instructions?: string | null;
  research_depth: ResearchDepth;
  status: ResearchStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  sources_count: number;
  has_report: boolean;
}

export interface SystemStatus {
  ai_provider: string;
  search_provider: string;
  gemini_configured: boolean;
  openai_configured: boolean;
  tavily_configured: boolean;
  database_ok: boolean;
}

export interface FollowUpResponse {
  question: string;
  answer: string;
  referenced_sources: string[];
}

export interface LiveAgentEvent {
  type: string;
  session_id?: string;
  timestamp?: string;
  message?: string;
  status?: string;
  stage?: string;
  plan?: ResearchPlan;
  source?: ResearchSource;
  query?: string;
  current_question?: string;
  question_index?: number;
  total_questions?: number;
  total_sources_found?: number;
  analysis?: any;
  executive_summary?: string;
  report_preview?: string;
  error?: string;
}


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
  models_utilized?: string[];
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
  source?: Partial<ResearchSource>;
  query?: string;
  current_question?: string;
  question_index?: number;
  total_questions?: number;
  total_sources_found?: number;
  analysis?: any;
  executive_summary?: string;
  report_preview?: string;
  error?: string;
  [key: string]: any;
}

// Minimal D1 types to avoid external dependency issues if @cloudflare/workers-types isn't installed
export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: any;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

export interface Env {
  DB?: D1Database;
  ASSETS?: { fetch: typeof fetch };
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
  SEARCH_PROVIDER?: string;
  TAVILY_API_KEY?: string;
  MAX_SEARCH_RESULTS_PER_QUERY?: string;
  CORS_ORIGIN?: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}


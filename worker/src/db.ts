import {
  Env,
  ResearchSession,
  ResearchSessionSummary,
  ResearchSource,
  ResearchPlan,
  ResearchStatus,
  LiveAgentEvent,
} from './types.js';

// In-memory fallback stores when D1 binding is not provided (e.g. initial dev/mock mode)
const memorySessions = new Map<string, ResearchSession>();
const memorySources = new Map<string, ResearchSource[]>();
const memoryEvents = new Map<string, Array<{ id: number; event: LiveAgentEvent; created_at: string }>>();
let memoryEventCounter = 0;

export async function checkDatabaseOk(env: Env): Promise<boolean> {
  if (env.DB) {
    try {
      await env.DB.prepare('SELECT 1').first();
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

export async function createSession(env: Env, session: ResearchSession): Promise<ResearchSession> {
  if (env.DB) {
    await env.DB.prepare(`
      INSERT INTO research_sessions (id, topic, instructions, research_depth, status, error_message, research_plan, report, executive_summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      session.topic,
      session.instructions || null,
      session.research_depth,
      session.status,
      session.error_message || null,
      session.research_plan ? JSON.stringify(session.research_plan) : null,
      session.report || null,
      session.executive_summary || null,
      session.created_at,
      session.updated_at
    ).run();
    return session;
  }

  memorySessions.set(session.id, { ...session, sources: [] });
  memorySources.set(session.id, []);
  return session;
}

export async function getSession(env: Env, id: string): Promise<ResearchSession | null> {
  if (env.DB) {
    const row = await env.DB.prepare(`
      SELECT * FROM research_sessions WHERE id = ?
    `).bind(id).first<any>();

    if (!row) return null;

    const sourcesResult = await env.DB.prepare(`
      SELECT * FROM research_sources WHERE research_session_id = ? ORDER BY created_at ASC
    `).bind(id).all<any>();

    const sources: ResearchSource[] = (sourcesResult.results || []).map((s) => ({
      id: s.id,
      research_session_id: s.research_session_id,
      title: s.title,
      url: s.url,
      domain: s.domain,
      snippet: s.snippet,
      extracted_content: s.extracted_content,
      relevance_score: s.relevance_score,
      relevance_explanation: s.relevance_explanation,
      query_used: s.query_used,
      created_at: s.created_at,
    }));

    return {
      id: row.id,
      topic: row.topic,
      instructions: row.instructions,
      research_depth: row.research_depth,
      status: row.status,
      error_message: row.error_message,
      research_plan: row.research_plan ? JSON.parse(row.research_plan) : null,
      report: row.report,
      executive_summary: row.executive_summary,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sources,
    };
  }

  const session = memorySessions.get(id);
  if (!session) return null;
  const sources = memorySources.get(id) || [];
  return { ...session, sources };
}

export async function listSessions(env: Env): Promise<ResearchSessionSummary[]> {
  if (env.DB) {
    const result = await env.DB.prepare(`
      SELECT s.id, s.topic, s.instructions, s.research_depth, s.status, s.error_message, s.report, s.created_at, s.updated_at,
             COUNT(src.id) as sources_count
      FROM research_sessions s
      LEFT JOIN research_sources src ON src.research_session_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all<any>();

    return (result.results || []).map((r) => ({
      id: r.id,
      topic: r.topic,
      instructions: r.instructions,
      research_depth: r.research_depth,
      status: r.status,
      error_message: r.error_message,
      created_at: r.created_at,
      updated_at: r.updated_at,
      sources_count: Number(r.sources_count || 0),
      has_report: Boolean(r.report && r.report.trim().length > 0),
    }));
  }

  const out: ResearchSessionSummary[] = [];
  for (const session of memorySessions.values()) {
    const sources = memorySources.get(session.id) || [];
    out.push({
      id: session.id,
      topic: session.topic,
      instructions: session.instructions,
      research_depth: session.research_depth,
      status: session.status,
      error_message: session.error_message,
      created_at: session.created_at,
      updated_at: session.updated_at,
      sources_count: sources.length,
      has_report: Boolean(session.report && session.report.trim().length > 0),
    });
  }
  return out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateSessionStatus(
  env: Env,
  id: string,
  status: ResearchStatus
): Promise<void> {
  const now = new Date().toISOString();
  if (env.DB) {
    await env.DB.prepare(`
      UPDATE research_sessions SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, now, id).run();
    return;
  }

  const s = memorySessions.get(id);
  if (s) {
    s.status = status;
    s.updated_at = now;
  }
}

export async function updateSessionPlan(
  env: Env,
  id: string,
  plan: ResearchPlan
): Promise<void> {
  const now = new Date().toISOString();
  if (env.DB) {
    await env.DB.prepare(`
      UPDATE research_sessions SET research_plan = ?, updated_at = ? WHERE id = ?
    `).bind(JSON.stringify(plan), now, id).run();
    return;
  }

  const s = memorySessions.get(id);
  if (s) {
    s.research_plan = plan;
    s.updated_at = now;
  }
}

export async function updateSessionReport(
  env: Env,
  id: string,
  report: string,
  executiveSummary: string | null
): Promise<void> {
  const now = new Date().toISOString();
  if (env.DB) {
    await env.DB.prepare(`
      UPDATE research_sessions
      SET report = ?, executive_summary = ?, status = 'completed', updated_at = ?
      WHERE id = ?
    `).bind(report, executiveSummary, now, id).run();
    return;
  }

  const s = memorySessions.get(id);
  if (s) {
    s.report = report;
    s.executive_summary = executiveSummary;
    s.status = 'completed';
    s.updated_at = now;
  }
}

export async function updateSessionError(
  env: Env,
  id: string,
  error: string
): Promise<void> {
  const now = new Date().toISOString();
  if (env.DB) {
    await env.DB.prepare(`
      UPDATE research_sessions
      SET status = 'failed', error_message = ?, updated_at = ?
      WHERE id = ?
    `).bind(error, now, id).run();
    return;
  }

  const s = memorySessions.get(id);
  if (s) {
    s.status = 'failed';
    s.error_message = error;
    s.updated_at = now;
  }
}

export async function addSource(env: Env, source: ResearchSource): Promise<void> {
  if (env.DB) {
    await env.DB.prepare(`
      INSERT INTO research_sources (id, research_session_id, title, url, domain, snippet, extracted_content, relevance_score, relevance_explanation, query_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      source.id,
      source.research_session_id,
      source.title,
      source.url,
      source.domain,
      source.snippet,
      source.extracted_content || null,
      source.relevance_score || 100,
      source.relevance_explanation || null,
      source.query_used || null,
      source.created_at
    ).run();
    return;
  }

  const list = memorySources.get(source.research_session_id) || [];
  list.push(source);
  memorySources.set(source.research_session_id, list);
}

export async function deleteSession(env: Env, id: string): Promise<boolean> {
  if (env.DB) {
    await env.DB.prepare(`DELETE FROM research_events WHERE session_id = ?`).bind(id).run();
    await env.DB.prepare(`DELETE FROM research_sources WHERE research_session_id = ?`).bind(id).run();
    const res = await env.DB.prepare(`DELETE FROM research_sessions WHERE id = ?`).bind(id).run();
    return (res.meta?.changes ?? 1) > 0;
  }

  const existed = memorySessions.has(id);
  memorySessions.delete(id);
  memorySources.delete(id);
  memoryEvents.delete(id);
  return existed;
}

export async function addEvent(
  env: Env,
  sessionId: string,
  eventType: string,
  eventData: LiveAgentEvent
): Promise<number> {
  const now = new Date().toISOString();
  if (env.DB) {
    const res = await env.DB.prepare(`
      INSERT INTO research_events (session_id, event_type, event_data, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(sessionId, eventType, JSON.stringify(eventData), now).run();
    return res.meta?.last_row_id || 0;
  }

  const list = memoryEvents.get(sessionId) || [];
  memoryEventCounter += 1;
  const item = { id: memoryEventCounter, event: eventData, created_at: now };
  list.push(item);
  memoryEvents.set(sessionId, list);
  return item.id;
}

export async function getEvents(
  env: Env,
  sessionId: string,
  afterId: number = 0
): Promise<Array<{ id: number; event: LiveAgentEvent }>> {
  if (env.DB) {
    const result = await env.DB.prepare(`
      SELECT id, event_data FROM research_events
      WHERE session_id = ? AND id > ?
      ORDER BY id ASC
    `).bind(sessionId, afterId).all<any>();

    return (result.results || []).map((r) => ({
      id: r.id,
      event: JSON.parse(r.event_data),
    }));
  }

  const list = memoryEvents.get(sessionId) || [];
  return list
    .filter((i) => i.id > afterId)
    .map((i) => ({ id: i.id, event: i.event }));
}

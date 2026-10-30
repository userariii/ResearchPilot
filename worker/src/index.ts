import { Env, ExecutionContext, ResearchSession } from './types.js';
import {
  checkDatabaseOk,
  createSession,
  getSession,
  listSessions,
  deleteSession,
} from './db.js';
import { ResearchAgent } from './agent.js';
import { getAIService } from './ai.js';
import { createEventStream } from './events.js';
import { ReportService } from './report.js';

function getCorsHeaders(env: Env, request: Request): Headers {
  const origin = request.headers.get('Origin') || '*';
  const allowed = env.CORS_ORIGIN || '*';
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', allowed === '*' ? '*' : origin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

function jsonResponse(data: any, status = 200, extraHeaders?: Headers): Response {
  const headers = new Headers(extraHeaders);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = getCorsHeaders(env, request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. Health check
      if (path === '/api/health') {
        return jsonResponse(
          {
            status: 'healthy',
            service: 'ResearchPilot API (Cloudflare Worker)',
            version: '1.0.0',
          },
          200,
          corsHeaders
        );
      }

      // 2. System Status
      if (path === '/api/system/status') {
        const hasGemini = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim());
        const hasOpenai = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim());
        const hasTavily = Boolean(env.TAVILY_API_KEY && env.TAVILY_API_KEY.trim());

        let aiProvider = (env.AI_PROVIDER || 'auto').toLowerCase();
        if (aiProvider === 'auto') {
          if (hasGemini && hasOpenai) aiProvider = 'ensemble';
          else if (hasGemini) aiProvider = 'gemini';
          else if (hasOpenai) aiProvider = 'openai';
          else aiProvider = 'mock';
        }

        let searchProvider = (env.SEARCH_PROVIDER || 'auto').toLowerCase();
        if (searchProvider === 'auto') {
          searchProvider = hasTavily ? 'tavily' : 'mock';
        }

        const dbOk = await checkDatabaseOk(env);

        return jsonResponse(
          {
            ai_provider: aiProvider,
            search_provider: searchProvider,
            gemini_configured: hasGemini,
            openai_configured: hasOpenai,
            tavily_configured: hasTavily,
            database_ok: dbOk,
          },
          200,
          corsHeaders
        );
      }

      // 3. Create Research Session
      if (path === '/api/research' && request.method === 'POST') {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return jsonResponse({ detail: 'Invalid JSON request payload' }, 422, corsHeaders);
        }

        const topic = (payload?.topic || '').trim();
        const instructions = (payload?.instructions || '').trim();
        const depth = (payload?.research_depth || 'standard').toLowerCase().trim();

        if (!topic || topic.length < 3 || topic.length > 500) {
          return jsonResponse(
            { detail: 'Field topic must be between 3 and 500 characters.' },
            422,
            corsHeaders
          );
        }

        if (!['quick', 'standard', 'deep'].includes(depth)) {
          return jsonResponse(
            { detail: "research_depth must be one of: 'quick', 'standard', 'deep'" },
            422,
            corsHeaders
          );
        }

        const now = new Date().toISOString();
        const sessionId = crypto.randomUUID();

        const session: ResearchSession = {
          id: sessionId,
          topic,
          instructions: instructions || null,
          research_depth: depth as any,
          status: 'pending',
          error_message: null,
          research_plan: null,
          report: null,
          executive_summary: null,
          created_at: now,
          updated_at: now,
          sources: [],
        };

        await createSession(env, session);

        // Execute autonomous research in background via Worker execution context
        const agent = new ResearchAgent();
        ctx.waitUntil(agent.run(sessionId, env));

        return jsonResponse(session, 201, corsHeaders);
      }

      // 4. List Research Sessions
      if (path === '/api/research' && request.method === 'GET') {
        const list = await listSessions(env);
        return jsonResponse(list, 200, corsHeaders);
      }

      // 5. Match /api/research/:id routes
      const sessionMatch = path.match(/^\/api\/research\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?$/);
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const subAction = sessionMatch[2];

        // GET /api/research/:id/events (SSE)
        if (subAction === 'events' && request.method === 'GET') {
          const session = await getSession(env, sessionId);
          if (!session) {
            return jsonResponse({ detail: 'Research session not found' }, 404, corsHeaders);
          }
          const sseResponse = createEventStream(env, sessionId, request.signal);
          // Apply CORS headers to SSE response
          corsHeaders.forEach((val: string, key: string) => sseResponse.headers.set(key, val));
          return sseResponse;
        }

        // GET /api/research/:id/export
        if (subAction === 'export' && request.method === 'GET') {
          const session = await getSession(env, sessionId);
          if (!session) {
            return jsonResponse({ detail: 'Research session not found' }, 404, corsHeaders);
          }
          if (!session.report) {
            return jsonResponse(
              { detail: 'Research report has not been generated yet' },
              400,
              corsHeaders
            );
          }

          const exportContent = ReportService.formatExportMarkdown(
            session.topic,
            session.report,
            session.sources,
            session.created_at
          );

          let cleanFilename = session.topic
            .slice(0, 40)
            .replace(/[^a-zA-Z0-9-_]/g, '')
            .trim();
          if (!cleanFilename) {
            cleanFilename = `research-report-${session.id.slice(0, 8)}`;
          }

          const exportHeaders = new Headers(corsHeaders);
          exportHeaders.set('Content-Type', 'text/markdown; charset=utf-8');
          exportHeaders.set('Content-Disposition', `attachment; filename="${cleanFilename}.md"`);

          return new Response(exportContent, {
            status: 200,
            headers: exportHeaders,
          });
        }

        // POST /api/research/:id/follow-up
        if (subAction === 'follow-up' && request.method === 'POST') {
          const session = await getSession(env, sessionId);
          if (!session) {
            return jsonResponse({ detail: 'Research session not found' }, 404, corsHeaders);
          }
          if (!session.report) {
            return jsonResponse(
              { detail: 'Report is not yet completed for this research session' },
              400,
              corsHeaders
            );
          }

          let body: any;
          try {
            body = await request.json();
          } catch {
            return jsonResponse({ detail: 'Invalid JSON payload' }, 422, corsHeaders);
          }

          const question = (body?.question || '').trim();
          if (!question || question.length < 3 || question.length > 1000) {
            return jsonResponse(
              { detail: 'Question must be between 3 and 1000 characters.' },
              422,
              corsHeaders
            );
          }

          const aiService = getAIService(env);
          const answer = await aiService.answerFollowUp(
            question,
            session.report,
            session.sources.map((s) => ({
              title: s.title,
              url: s.url,
              domain: s.domain,
              snippet: s.snippet,
              query: s.query_used || '',
            }))
          );

          const referenced = session.sources.slice(0, 5).map((s) => s.title);

          return jsonResponse(
            {
              question,
              answer,
              referenced_sources: referenced,
            },
            200,
            corsHeaders
          );
        }

        // GET /api/research/:id
        if (!subAction && request.method === 'GET') {
          const session = await getSession(env, sessionId);
          if (!session) {
            return jsonResponse({ detail: 'Research session not found' }, 404, corsHeaders);
          }
          return jsonResponse(session, 200, corsHeaders);
        }

        // DELETE /api/research/:id
        if (!subAction && request.method === 'DELETE') {
          const deleted = await deleteSession(env, sessionId);
          if (!deleted) {
            return jsonResponse({ detail: 'Research session not found' }, 404, corsHeaders);
          }
          return jsonResponse(
            { message: 'Research session successfully deleted', id: sessionId },
            200,
            corsHeaders
          );
        }
      }

      // Root endpoint
      if (path === '/' || path === '/api') {
        return jsonResponse(
          {
            message: 'Welcome to ResearchPilot API on Cloudflare Workers',
            health_url: '/api/health',
            status_url: '/api/system/status',
            docs: 'https://github.com',
          },
          200,
          corsHeaders
        );
      }

      // 6. Forward to Static Assets if configured (Unified Worker + Static Assets)
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return jsonResponse({ detail: 'Endpoint not found' }, 404, corsHeaders);
    } catch (err: any) {
      return jsonResponse(
        {
          detail: 'Internal Worker error occurred',
          error: err?.message || String(err),
        },
        500,
        corsHeaders
      );
    }
  },
};

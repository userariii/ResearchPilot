import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker from '../dist/index.js';

function createMockD1() {
  const sqlite = new DatabaseSync(':memory:');

  // Initialize schema
  const schema = `
    CREATE TABLE IF NOT EXISTS research_sessions (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      instructions TEXT,
      research_depth TEXT NOT NULL DEFAULT 'standard',
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      research_plan TEXT,
      report TEXT,
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
      event_data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `;
  sqlite.exec(schema);

  return {
    prepare(sql) {
      let boundParams = [];
      return {
        bind(...params) {
          boundParams = params;
          return this;
        },
        async run() {
          const stmt = sqlite.prepare(sql);
          const result = stmt.run(...boundParams);
          return {
            success: true,
            meta: {
              changes: result.changes,
              last_row_id: Number(result.lastInsertRowid),
            },
          };
        },
        async first(colName) {
          const stmt = sqlite.prepare(sql);
          const row = stmt.get(...boundParams);
          if (!row) return null;
          if (colName) return row[colName];
          return row;
        },
        async all() {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...boundParams);
          return {
            success: true,
            results: rows,
          };
        },
      };
    },
  };
}

function createMockCtx() {
  const promises = [];
  return {
    waitUntil(p) {
      promises.push(p);
    },
    promises,
  };
}

test('Cloudflare Worker with simulated D1 Database', async () => {
  const mockD1 = createMockD1();
  const env = {
    DB: mockD1,
    AI_PROVIDER: 'mock',
    SEARCH_PROVIDER: 'mock',
  };

  const ctx = createMockCtx();

  // 1. Health & System Status with D1
  const statusRes = await worker.fetch(new Request('http://localhost/api/system/status'), env, ctx);
  assert.equal(statusRes.status, 200);
  const statusData = await statusRes.json();
  assert.equal(statusData.database_ok, true);

  // 2. Create Session with D1
  const createRes = await worker.fetch(
    new Request('http://localhost/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Cloudflare D1 Persistence Verification',
        research_depth: 'quick',
      }),
    }),
    env,
    ctx
  );
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.ok(created.id);

  // 3. Wait for agent execution to write plan, sources, report to D1
  await Promise.all(ctx.promises);

  // 4. Query session from D1
  const getRes = await worker.fetch(new Request(`http://localhost/api/research/${created.id}`), env, ctx);
  assert.equal(getRes.status, 200);
  const completed = await getRes.json();
  assert.equal(completed.status, 'completed');
  assert.ok(completed.sources.length > 0);
  assert.ok(completed.report.includes('## 1. Executive Summary'));

  // 5. Query list with D1 aggregation
  const listRes = await worker.fetch(new Request('http://localhost/api/research'), env, ctx);
  assert.equal(listRes.status, 200);
  const list = await listRes.json();
  assert.ok(list.length > 0);
  assert.ok(list[0].sources_count > 0);
  assert.equal(list[0].has_report, true);

  // 6. Delete from D1
  const delRes = await worker.fetch(
    new Request(`http://localhost/api/research/${created.id}`, { method: 'DELETE' }),
    env,
    ctx
  );
  assert.equal(delRes.status, 200);

  // 7. Verify 404
  const getDeletedRes = await worker.fetch(new Request(`http://localhost/api/research/${created.id}`), env, ctx);
  assert.equal(getDeletedRes.status, 404);
});


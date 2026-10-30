import {
  ResearchSession,
  ResearchSessionSummary,
  SystemStatus,
  FollowUpResponse,
  LiveAgentEvent,
} from '../types';

const rawBase = (import.meta.env.VITE_API_BASE || '/api').trim().replace(/\/+$/, '');
const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

export async function createResearch(payload: {
  topic: string;
  instructions?: string;
  research_depth: string;
}): Promise<ResearchSession> {
  const res = await fetch(`${API_BASE}/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create research (${res.status})`);
  }
  return res.json();
}

export async function listResearch(): Promise<ResearchSessionSummary[]> {
  const res = await fetch(`${API_BASE}/research`);
  if (!res.ok) {
    throw new Error(`Failed to list research sessions (${res.status})`);
  }
  return res.json();
}

export async function getResearch(id: string): Promise<ResearchSession> {
  const res = await fetch(`${API_BASE}/research/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch research session (${res.status})`);
  }
  return res.json();
}

export async function deleteResearch(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/research/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete research session (${res.status})`);
  }
}

export async function askFollowUp(
  id: string,
  question: string
): Promise<FollowUpResponse> {
  const res = await fetch(`${API_BASE}/research/${id}/follow-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to process follow-up (${res.status})`);
  }
  return res.json();
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) {
    throw new Error('Failed to fetch system status');
  }
  return res.json();
}

export function getExportUrl(id: string): string {
  return `${API_BASE}/research/${id}/export`;
}

export function subscribeToEvents(
  sessionId: string,
  onEvent: (event: LiveAgentEvent) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/research/${sessionId}/events`);

  eventSource.onmessage = (e) => {
    try {
      const data: LiveAgentEvent = JSON.parse(e.data);
      onEvent(data);
    } catch (err) {
      console.warn('Failed to parse SSE event data', e.data, err);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}


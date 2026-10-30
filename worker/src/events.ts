import { Env, LiveAgentEvent } from './types.js';
import { addEvent, getEvents } from './db.js';

type EventListener = (event: LiveAgentEvent) => void;
const localListeners = new Map<string, Set<EventListener>>();

export async function publishEvent(
  env: Env,
  sessionId: string,
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  const event: LiveAgentEvent = {
    type: eventType,
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // 1. Write to database (D1 or memory) for distributed availability across worker isolates
  await addEvent(env, sessionId, eventType, event);

  // 2. Dispatch to local isolate subscribers if connected
  const set = localListeners.get(sessionId);
  if (set) {
    for (const listener of set) {
      try {
        listener(event);
      } catch {
        // ignore
      }
    }
  }
}

export function subscribeLocal(sessionId: string, listener: EventListener): () => void {
  let set = localListeners.get(sessionId);
  if (!set) {
    set = new Set();
    localListeners.set(sessionId, set);
  }
  set.add(listener);

  return () => {
    set?.delete(listener);
    if (set && set.size === 0) {
      localListeners.delete(sessionId);
    }
  };
}

export function createEventStream(env: Env, sessionId: string, signal?: AbortSignal): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller: any) {
      // 1. Initial SSE handshake comment
      controller.enqueue(encoder.encode(': connected\n\n'));

      let lastEventId = 0;
      let isClosed = false;

      const pushEvent = (event: LiveAgentEvent) => {
        if (isClosed) return;
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          isClosed = true;
        }
      };

      // 2. Stream historical events from DB
      try {
        const pastEvents = await getEvents(env, sessionId, 0);
        for (const item of pastEvents) {
          pushEvent(item.event);
          lastEventId = Math.max(lastEventId, item.id);
        }
      } catch {
        // ignore DB read error
      }

      // Check if already in terminal state
      let lastTerminalCheck = false;

      // 3. Setup polling loop across Cloudflare Workers isolates
      let pingCounter = 0;
      const intervalId = setInterval(async () => {
        if (isClosed || signal?.aborted) {
          clearInterval(intervalId);
          unsubscribeLocal();
          try {
            controller.close();
          } catch {
            // ignore
          }
          return;
        }

        pingCounter += 1;
        // Keepalive ping every ~15 seconds (30 * 500ms)
        if (pingCounter % 30 === 0) {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'));
          } catch {
            isClosed = true;
          }
        }

        try {
          const newEvents = await getEvents(env, sessionId, lastEventId);
          for (const item of newEvents) {
            pushEvent(item.event);
            lastEventId = Math.max(lastEventId, item.id);
            if (['completed', 'failed'].includes(item.event.type)) {
              lastTerminalCheck = true;
            }
          }
        } catch {
          // ignore
        }

        if (lastTerminalCheck) {
          // Allow client 2 seconds to receive final event before closing stream
          setTimeout(() => {
            if (!isClosed) {
              isClosed = true;
              clearInterval(intervalId);
              unsubscribeLocal();
              try {
                controller.close();
              } catch {
                // ignore
              }
            }
          }, 2000);
        }
      }, 500);

      // Local isolate listener for instant low-latency dispatch
      const unsubscribeLocal = subscribeLocal(sessionId, (event) => {
        pushEvent(event);
        if (['completed', 'failed'].includes(event.type)) {
          lastTerminalCheck = true;
        }
      });

      if (signal) {
        signal.addEventListener('abort', () => {
          isClosed = true;
          clearInterval(intervalId);
          unsubscribeLocal();
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

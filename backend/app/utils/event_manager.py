import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, List, Any


class EventManager:
    """
    Manages Server-Sent Events (SSE) subscribers and event queues for research sessions.
    Supports real-time streaming of research milestones, questions, search queries, sources, and reports.
    """

    def __init__(self):
        # Maps session_id -> list of asyncio.Queue
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}
        # Stores recent event history per session for late-joining or reconnecting clients
        self._history: Dict[str, List[Dict[str, Any]]] = {}
        self._lock = asyncio.Lock()

    async def subscribe(self, session_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        async with self._lock:
            if session_id not in self._subscribers:
                self._subscribers[session_id] = []
            self._subscribers[session_id].append(queue)

            # Replay existing history to new subscriber
            if session_id in self._history:
                for event in self._history[session_id]:
                    await queue.put(event)

        return queue

    async def unsubscribe(self, session_id: str, queue: asyncio.Queue):
        async with self._lock:
            if session_id in self._subscribers:
                if queue in self._subscribers[session_id]:
                    self._subscribers[session_id].remove(queue)
                if not self._subscribers[session_id]:
                    del self._subscribers[session_id]

    async def publish(self, session_id: str, event_type: str, data: Dict[str, Any]):
        event = {
            "type": event_type,
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **data,
        }

        async with self._lock:
            if session_id not in self._history:
                self._history[session_id] = []
            self._history[session_id].append(event)
            # Limit history to latest 100 events per session
            if len(self._history[session_id]) > 100:
                self._history[session_id] = self._history[session_id][-100:]

            subscribers = self._subscribers.get(session_id, [])
            for queue in subscribers:
                await queue.put(event)

    def clear_session(self, session_id: str):
        if session_id in self._history:
            del self._history[session_id]


event_manager = EventManager()


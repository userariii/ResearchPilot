import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Menu, Compass, Plus, Loader2 } from 'lucide-react';
import {
  ResearchSession,
  ResearchSessionSummary,
  ResearchDepth,
  SystemStatus,
  LiveAgentEvent,
} from './types';
import {
  listResearch,
  getResearch,
  createResearch,
  deleteResearch,
  getSystemStatus,
  subscribeToEvents,
} from './api/client';
import { Sidebar } from './components/Sidebar';
import { NewResearchDashboard } from './components/NewResearchDashboard';
import { ResearchProgressView } from './components/ResearchProgressView';
import { ReportViewer } from './components/ReportViewer';
import { SystemStatusModal } from './components/SystemStatusModal';

export const App: React.FC = () => {
  const [sessions, setSessions] = useState<ResearchSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [viewMode, setViewMode] = useState<'new' | 'progress' | 'report'>('new');
  const [events, setEvents] = useState<LiveAgentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch session history & system status on mount
  const refreshHistory = useCallback(async () => {
    try {
      const data = await listResearch();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load research history', err);
    }
  }, []);

  const refreshSystem = useCallback(async () => {
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      console.warn('System status not reachable yet', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshHistory(), refreshSystem()]).finally(() => {
      setIsAppLoading(false);
    });
  }, [refreshHistory, refreshSystem]);

  // Clean up SSE subscription
  const cleanupSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Connect SSE for active session
  const connectSSE = useCallback((sessionId: string) => {
    cleanupSubscription();
    setEvents([]);

    const unsub = subscribeToEvents(
      sessionId,
      (event: LiveAgentEvent) => {
        setEvents((prev) => [...prev, event]);

        if (event.type === 'status_changed' && event.status) {
          setActiveSession((prev) => (prev ? { ...prev, status: event.status as any } : prev));
        } else if (event.type === 'plan_created' && event.plan) {
          setActiveSession((prev) => (prev ? { ...prev, research_plan: event.plan } : prev));
        } else if (event.type === 'source_discovered' && event.source) {
          setActiveSession((prev) => {
            if (!prev) return prev;
            const exists = prev.sources.some((s) => s.url === event.source?.url);
            if (exists) return prev;
            return { ...prev, sources: [...prev.sources, event.source!] };
          });
        } else if (event.type === 'completed') {
          // Re-fetch full session to get entire persisted report and sources
          getResearch(sessionId).then((full) => {
            setActiveSession(full);
            refreshHistory();
          });
        } else if (event.type === 'failed') {
          getResearch(sessionId).then((full) => {
            setActiveSession(full);
            refreshHistory();
          });
        }
      },
      (err) => {
        console.warn('SSE event stream warning', err);
      }
    );

    unsubscribeRef.current = unsub;
  }, [cleanupSubscription, refreshHistory]);

  // Handle selecting a session
  const handleSelectSession = async (id: string) => {
    setIsLoading(true);
    try {
      const session = await getResearch(id);
      setActiveSession(session);
      setActiveSessionId(id);

      if (session.status === 'completed' && session.report) {
        setViewMode('report');
        cleanupSubscription();
      } else {
        setViewMode('progress');
        connectSSE(id);
      }
    } catch (err) {
      console.error('Failed to load session details', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start new research
  const handleStartResearch = async (topic: string, instructions: string, depth: ResearchDepth) => {
    setIsLoading(true);
    try {
      const created = await createResearch({
        topic,
        instructions: instructions || undefined,
        research_depth: depth,
      });

      setActiveSession(created);
      setActiveSessionId(created.id);
      setViewMode('progress');
      refreshHistory();

      // Subscribe to real-time events
      connectSSE(created.id);
    } catch (err: any) {
      alert(`Error launching research: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to new research view
  const handleNewResearch = () => {
    cleanupSubscription();
    setActiveSessionId(null);
    setActiveSession(null);
    setEvents([]);
    setViewMode('new');
  };

  // Delete session
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this research session?')) return;

    try {
      await deleteResearch(id);
      if (activeSessionId === id) {
        handleNewResearch();
      }
      refreshHistory();
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  if (isAppLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f0f10]">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-900 dark:text-white" />
          <p className="text-xs font-mono text-neutral-400">Loading ResearchPilot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f10] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewResearch={handleNewResearch}
        onDeleteSession={handleDeleteSession}
        systemStatus={systemStatus}
        onOpenSystemModal={() => setIsSystemModalOpen(true)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-30 lg:hidden bg-white/90 dark:bg-[#141416]/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-black dark:text-white" />
            <span className="font-semibold text-xs tracking-tight text-neutral-900 dark:text-white">
              ResearchPilot
            </span>
          </div>
          <button
            onClick={handleNewResearch}
            className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            title="Start new research"
          >
            <Plus className="w-4 h-4" />
          </button>
        </header>

        {/* View Switcher */}
        <main className="flex-1">
          {viewMode === 'new' && (
            <NewResearchDashboard
              onStartResearch={handleStartResearch}
              isLoading={isLoading}
              recentSessions={sessions}
              onSelectSession={handleSelectSession}
            />
          )}

          {viewMode === 'progress' && activeSession && (
            <ResearchProgressView
              session={activeSession}
              events={events}
              onViewReport={() => setViewMode('report')}
            />
          )}

          {viewMode === 'report' && activeSession && (
            <ReportViewer session={activeSession} />
          )}
        </main>
      </div>

      {/* System Status / Settings Modal */}
      <SystemStatusModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        status={systemStatus}
        onRefresh={refreshSystem}
      />
    </div>
  );
};


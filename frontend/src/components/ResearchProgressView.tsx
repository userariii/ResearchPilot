import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ResearchSession, LiveAgentEvent } from '../types';

interface Props {
  session: ResearchSession;
  events: LiveAgentEvent[];
  onViewReport: () => void;
}

const STAGES = [
  { key: 'understanding', label: 'Intent' },
  { key: 'planning', label: 'Planning' },
  { key: 'searching', label: 'Searching' },
  { key: 'analyzing', label: 'Analysis' },
  { key: 'generating', label: 'Report' },
  { key: 'completed', label: 'Finished' },
];

export const ResearchProgressView: React.FC<Props> = ({ session, events, onViewReport }) => {
  const [showLog, setShowLog] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabledRef = useRef<boolean>(true);

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'understanding': return 0;
      case 'planning': return 1;
      case 'searching': return 2;
      case 'analyzing': return 3;
      case 'generating': return 4;
      case 'completed': return 5;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(session.status);
  const isCompleted = session.status === 'completed';
  const isFailed = session.status === 'failed';

  const displayEvents = events.filter((e) => e.type !== 'connected' && e.message);
  const lastEvent = displayEvents[displayEvents.length - 1];
  const activeMessage = lastEvent?.message || 'Agent executing workflow...';

  // Auto-scroll log to latest message unless user scrolls up
  useEffect(() => {
    if (isAutoScrollEnabledRef.current && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayEvents.length, showLog]);

  const handleLogScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    // If user is within 30px of the bottom, keep auto-scroll active
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    isAutoScrollEnabledRef.current = isAtBottom;
  };

  // Automatically open report immediately upon task completion
  useEffect(() => {
    if (session.status === 'completed' && session.report) {
      onViewReport();
    }
  }, [session.status, session.report, onViewReport]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14 space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Depth: {session.research_depth}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="text-[10px] font-mono uppercase text-neutral-400">
                {session.sources.length} sources found
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white leading-snug">
              {session.topic}
            </h1>
            {session.instructions && (
              <p className="text-xs text-neutral-500 italic mt-1">
                {session.instructions}
              </p>
            )}
          </div>
        </div>

        {/* Minimal Progress Stepper */}
        <div className="mt-8 pt-6 border-t border-neutral-200/60 dark:border-neutral-800">
          <div className="flex items-center justify-between text-xs">
            {STAGES.map((s, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex && !isFailed && !isCompleted;
              const isDone = (idx === currentIndex && isCompleted) || isPast;

              return (
                <div key={s.key} className="flex flex-col items-center gap-1.5 flex-1 relative">
                  {/* Step Dot */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono transition-all ${
                      isCurrent
                        ? 'bg-black text-white dark:bg-white dark:text-black ring-4 ring-neutral-200 dark:ring-neutral-800'
                        : isDone
                        ? 'bg-neutral-300 dark:bg-neutral-700 text-black dark:text-white'
                        : 'border border-neutral-300 dark:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {isCurrent ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isDone ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-[11px] tracking-tight ${
                      isCurrent
                        ? 'font-semibold text-black dark:text-white'
                        : isDone
                        ? 'text-neutral-700 dark:text-neutral-300'
                        : 'text-neutral-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Milestone Status */}
          <div className="mt-5 p-3 rounded-lg bg-neutral-50 dark:bg-[#1a1a1d] border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse shrink-0"></span>
              <span className="truncate">{activeMessage}</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400 shrink-0">
              {displayEvents.length} events
            </span>
          </div>
        </div>
      </div>

      {/* 2. Live Stream Terminal */}
      <div className="bg-[#101012] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowLog(!showLog)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#161619] border-b border-neutral-800 text-left"
        >
          <span className="text-xs font-mono text-neutral-300 font-medium">
            Live Stream Log
          </span>
          {showLog ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
        </button>

        {showLog && (
          <div
            ref={logContainerRef}
            onScroll={handleLogScroll}
            className="p-3.5 font-mono text-[11px] text-neutral-300 space-y-1.5 max-h-56 overflow-y-auto"
          >
            {displayEvents.length === 0 ? (
              <div className="text-neutral-500 italic">Initializing agent workflow...</div>
            ) : (
              displayEvents.map((e, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-neutral-500 shrink-0 select-none">
                    {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''}
                  </span>
                  <span className="text-neutral-600 select-none">›</span>
                  <span className="text-neutral-200">{e.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Discovered Sources Summary (Collapsed by default, expandable) */}
      {session.sources.length > 0 && (
        <div className="bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowSources(!showSources)}
            className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#18181b] transition-colors"
          >
            <span>Live Sources Discovered ({session.sources.length})</span>
            {showSources ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>

          {showSources && (
            <div className="p-4 pt-0 border-t border-neutral-200/60 dark:border-neutral-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 mt-3">
                {session.sources.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="p-2.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#18181b] text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1">
                        <span className="truncate max-w-[180px]">{s.domain}</span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-black dark:hover:text-white"
                          title="Open source"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <h4 className="font-medium text-neutral-900 dark:text-white line-clamp-1">
                        {s.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isFailed && (
        <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-neutral-600 mt-0.5" />
          <div>
            <h4 className="font-semibold">Task failed</h4>
            <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">{session.error_message || 'Unexpected error'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

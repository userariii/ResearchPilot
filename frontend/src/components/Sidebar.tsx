import React, { useState } from 'react';
import {
  Plus,
  Clock,
  Trash2,
  Search,
  Check,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { ResearchSessionSummary, SystemStatus } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  sessions: ResearchSessionSummary[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewResearch: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  systemStatus: SystemStatus | null;
  onOpenSystemModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewResearch,
  onDeleteSession,
  systemStatus,
  onOpenSystemModal,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.topic.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const getStatusDisplay = (status: string) => {
    const norm = (status || '').toLowerCase();
    if (norm === 'completed') {
      return {
        label: 'Completed',
        dotColor: 'bg-emerald-500',
        badgeClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/60',
        icon: <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
      };
    }
    if (norm === 'failed' || norm === 'cancelled' || norm === 'canceled') {
      return {
        label: 'Cancelled',
        dotColor: 'bg-rose-500',
        badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/60',
        icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
      };
    }
    // In progress (pending, planning, searching, analyzing, generating, etc.)
    return {
      label: 'In Progress',
      dotColor: 'bg-amber-500',
      badgeClass: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60',
      icon: <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />,
    };
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#fbfbfb] dark:bg-[#141416] border-r border-neutral-200 dark:border-neutral-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Clean Header */}
        <div className="h-14 px-4 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">
              ResearchPilot
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Action: New Research CTA */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewResearch();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-[0.99] rounded-lg font-medium text-xs tracking-tight transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Research</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search history..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#1a1a1c] border border-neutral-200 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        {/* Sessions History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            History ({filteredSessions.length})
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-neutral-400">
              {filterQuery ? 'No results found' : 'No research sessions yet.'}
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const statusInfo = getStatusDisplay(s.status);
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer text-left text-xs transition-colors ${
                    isActive
                      ? 'bg-neutral-200/70 dark:bg-neutral-800 text-black dark:text-white font-medium'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="mt-0.5">{statusInfo.icon}</div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="line-clamp-1 leading-snug font-medium text-neutral-900 dark:text-neutral-100">
                      {s.topic}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] whitespace-nowrap overflow-hidden">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-medium leading-none shrink-0 whitespace-nowrap ${statusInfo.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dotColor} ${statusInfo.label === 'In Progress' ? 'animate-pulse' : ''}`} />
                        <span className="whitespace-nowrap">{statusInfo.label}</span>
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-600 shrink-0 select-none">•</span>
                      <span className="text-neutral-400 dark:text-neutral-500 shrink-0 whitespace-nowrap">{formatDate(s.created_at)}</span>
                      <span className="text-neutral-300 dark:text-neutral-600 shrink-0 select-none">•</span>
                      <span className="text-neutral-400 dark:text-neutral-500 capitalize shrink-0 whitespace-nowrap">{s.research_depth}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => onDeleteSession(s.id, e)}
                    className="absolute right-2 top-2 p-1 rounded-md text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                    title="Delete session"
                    aria-label="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Config */}
        <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <button
            onClick={onOpenSystemModal}
            className="w-full flex items-center justify-between py-1.5 px-2 rounded-md text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Config & Models</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-neutral-200/60 dark:bg-neutral-800 px-1 py-0.5 rounded text-neutral-700 dark:text-neutral-300">
              {systemStatus?.ai_provider || 'Mock'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

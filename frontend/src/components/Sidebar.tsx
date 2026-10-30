import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Clock,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  ShieldCheck,
  FileText
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'failed':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      default:
        return <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin shrink-0" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">
                  ResearchPilot
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                  Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Autonomous Investigation</p>
            </div>
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl font-medium text-sm shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <Plus className="w-4 h-4" />
            <span>New Research</span>
          </button>
        </div>

        {/* History Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search previous research..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-brand-500/50 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Research History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>Research History ({filteredSessions.length})</span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-400 dark:text-slate-500">
              {filterQuery ? 'No matching research found' : 'No research sessions yet. Start your first research above.'}
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors text-left text-xs ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 font-medium border border-brand-200/80 dark:border-brand-800/60'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5">{getStatusBadge(s.status)}</div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="line-clamp-2 leading-snug break-words">
                      {s.topic}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{formatDate(s.created_at)}</span>
                      <span>•</span>
                      <span className="capitalize">{s.research_depth}</span>
                      {s.sources_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{s.sources_count} sources</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete Action button */}
                  <button
                    onClick={(e) => onDeleteSession(s.id, e)}
                    className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-700/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete research session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / System Status */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <button
            onClick={onOpenSystemModal}
            className="w-full flex items-center justify-between p-2 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <span>Provider Settings</span>
            </div>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {systemStatus?.ai_provider || 'Mock'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};


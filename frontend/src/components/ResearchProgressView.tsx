import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Globe,
  FileText,
  Search,
  Brain,
  Layers,
  ChevronDown,
  ChevronUp,
  Terminal,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { ResearchSession, LiveAgentEvent, ResearchSource } from '../types';

interface Props {
  session: ResearchSession;
  events: LiveAgentEvent[];
  onViewReport: () => void;
}

const STAGES = [
  { key: 'understanding', label: 'Analyzing Intent', icon: Brain },
  { key: 'planning', label: 'Formulating Plan', icon: Layers },
  { key: 'searching', label: 'Web Research', icon: Search },
  { key: 'analyzing', label: 'Synthesizing Evidence', icon: Compass },
  { key: 'generating', label: 'Compiling Report', icon: FileText },
  { key: 'completed', label: 'Verified & Saved', icon: CheckCircle2 },
];

export const ResearchProgressView: React.FC<Props> = ({ session, events, onViewReport }) => {
  const [showLog, setShowLog] = useState(true);
  const [showPlan, setShowPlan] = useState(true);

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

  // Last event message
  const lastEvent = events[events.length - 1];
  const activeMessage = lastEvent?.message || 'Agent executing workflow...';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                Autonomous Workflow Active
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                Depth: {session.research_depth}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {session.topic}
            </h1>
            {session.instructions && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                Focus: {session.instructions}
              </p>
            )}
          </div>

          {/* Action button if completed */}
          {isCompleted && (
            <button
              onClick={onViewReport}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all shrink-0"
            >
              <span>View Full Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Progress Stage Stepper */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {STAGES.map((s, idx) => {
              const Icon = s.icon;
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex && !isFailed && !isCompleted;
              const isDone = (idx === currentIndex && isCompleted) || isPast;

              return (
                <div
                  key={s.key}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                    isCurrent
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : isDone
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 text-slate-400'
                  }`}
                >
                  <div className="mb-1.5">
                    {isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand-600 dark:text-brand-400" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Icon className="w-5 h-5 opacity-60" />
                    )}
                  </div>
                  <span className="text-xs font-semibold tracking-tight">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Current Status Banner */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span className="font-medium">{activeMessage}</span>
            </div>
            <span className="text-slate-400">
              {session.sources.length} sources gathered
            </span>
          </div>
        </div>
      </div>

      {/* Plan Display (If generated) */}
      {session.research_plan && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowPlan(!showPlan)}
            className="w-full flex items-center justify-between p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-left"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Autonomous Research Plan ({session.research_plan.research_questions.length} Questions)
              </span>
            </div>
            {showPlan ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showPlan && (
            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400 bg-brand-50/50 dark:bg-brand-950/20 p-3 rounded-xl border border-brand-200/50 dark:border-brand-900/40">
                <span className="font-semibold text-brand-900 dark:text-brand-300">Objective: </span>
                {session.research_plan.objective}
              </div>

              <div className="space-y-2.5">
                {session.research_plan.research_questions.map((q, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span>{q.question}</span>
                    </div>
                    {q.rationale && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 pl-5 italic">
                        {q.rationale}
                      </p>
                    )}
                    <div className="pl-5 flex flex-wrap gap-1.5">
                      {q.search_queries.map((sq, sqIdx) => (
                        <span
                          key={sqIdx}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono"
                        >
                          🔍 {sq}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Discovered Sources Grid */}
      {session.sources.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Sources Retrieved in Real Time ({session.sources.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Deduplicated & verified</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {session.sources.map((s, idx) => (
              <div
                key={s.id || idx}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400">
                    <span className="font-mono text-brand-600 dark:text-brand-400 truncate max-w-[200px]">
                      {s.domain}
                    </span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-brand-500 transition-colors"
                      title="Open source url"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {s.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Agent Terminal / Activity Log */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <button
          onClick={() => setShowLog(!showLog)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-left"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-slate-300 font-semibold">
              Live Agent Execution Stream ({events.length} events)
            </span>
          </div>
          {showLog ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showLog && (
          <div className="p-4 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-64 overflow-y-auto bg-slate-950">
            {events.length === 0 ? (
              <div className="text-slate-500 italic">Waiting for agent milestones...</div>
            ) : (
              events.map((e, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 select-none">
                    {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '..:..:..'}
                  </span>
                  <span className="text-emerald-400 select-none">❯</span>
                  <span className="text-slate-200">{e.message || JSON.stringify(e)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {isFailed && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Research task interrupted</h4>
            <p className="mt-1">{session.error_message || 'An unexpected error occurred during execution.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};


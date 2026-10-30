import React from 'react';
import { X, Server, Cpu, Search, Database, CheckCircle2, AlertCircle, Key } from 'lucide-react';
import { SystemStatus } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus | null;
  onRefresh: () => void;
}

export const SystemStatusModal: React.FC<Props> = ({ isOpen, onClose, status, onRefresh }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">System Architecture & Providers</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Environment status & provider abstractions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {status ? (
            <>
              {/* AI Engine Status */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">AI Intelligence Provider</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                    {status.ai_provider}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    {status.gemini_configured ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Gemini API: {status.gemini_configured ? 'Active' : 'Unset'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    {status.openai_configured ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>OpenAI API: {status.openai_configured ? 'Active' : 'Unset'}</span>
                  </div>
                </div>
              </div>

              {/* Search Engine Status */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Web Search Provider</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {status.search_provider}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-2">
                  {status.tavily_configured ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Tavily Search: {status.tavily_configured ? 'Configured & Active' : 'Fallback / Mock Mode Active'}</span>
                </div>
              </div>

              {/* Database Status */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Persistent Storage</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    SQLite + SQLAlchemy
                  </span>
                </div>
              </div>

              {/* Configuration Tip */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>How to configure Live External APIs:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                  Set <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code>, <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">OPENAI_API_KEY</code>, or <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">TAVILY_API_KEY</code> in <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">.env</code>. The application automatically falls back to full-featured mock mode if credentials are omitted.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">Loading system status...</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <button
            onClick={onRefresh}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
          >
            Refresh Status
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


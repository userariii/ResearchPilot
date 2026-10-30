import React from 'react';
import { X, Server, Check, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-neutral-500" />
            <h3 className="font-semibold text-neutral-900 dark:text-white text-xs tracking-tight">
              System Configuration & Models
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-black dark:hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs">
          {status ? (
            <>
              {/* AI Engine Status */}
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#fafafa] dark:bg-[#18181b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">AI Intelligence Provider</span>
                  <span className="font-mono text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                    {status.ai_provider}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    {status.gemini_configured ? (
                      <Check className="w-3 h-3 text-neutral-900 dark:text-white" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                    )}
                    <span>Gemini: {status.gemini_configured ? 'Active' : 'Unset'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {status.openai_configured ? (
                      <Check className="w-3 h-3 text-neutral-900 dark:text-white" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                    )}
                    <span>OpenAI: {status.openai_configured ? 'Active' : 'Unset'}</span>
                  </div>
                </div>
              </div>

              {/* Search Engine Status */}
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#fafafa] dark:bg-[#18181b] flex items-center justify-between">
                <div>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 block">Web Search Provider</span>
                  <span className="text-[11px] text-neutral-500 mt-0.5 block">
                    {status.tavily_configured ? 'Tavily Search API' : 'Fallback / Mock Search'}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                  {status.search_provider}
                </span>
              </div>

              {/* Database */}
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#fafafa] dark:bg-[#18181b] flex items-center justify-between">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Persistence</span>
                <span className="font-mono text-[11px] text-neutral-500">
                  SQLite (SQLAlchemy)
                </span>
              </div>

              {/* Tip */}
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Configure offered models in <code className="font-mono text-neutral-700 dark:text-neutral-300">.env</code>:
                <br />
                <code className="text-[10px] text-neutral-500 font-mono block mt-1">
                  GEMINI_MODEL=gemini-3.5-flash, gemini-3.8-flash
                </code>
              </p>
            </>
          ) : (
            <div className="text-center py-6 text-neutral-400">Loading status...</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#fafafa] dark:bg-[#18181b] border-t border-neutral-200/80 dark:border-neutral-800/80 flex justify-between items-center text-xs">
          <button
            onClick={onRefresh}
            className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black rounded-md font-medium text-xs hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

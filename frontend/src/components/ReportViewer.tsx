import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  Calendar,
  Globe,
  Layers,
  FileText,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResearchSession } from '../types';
import { SourceExplorer } from './SourceExplorer';
import { FollowUpPanel } from './FollowUpPanel';
import { getExportUrl } from '../api/client';

interface Props {
  session: ResearchSession;
}

export const ReportViewer: React.FC<Props> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'sources' | 'followup'>('report');
  const [copied, setCopied] = useState(false);

  const handleCopyReport = async () => {
    if (!session.report) return;
    try {
      await navigator.clipboard.writeText(session.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                Verified Research Report
              </span>
              <span className="text-xs text-slate-400 capitalize flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {session.research_depth} Depth
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(session.created_at)}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {session.sources.length} Sources Analyzed
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {session.topic}
            </h1>

            {session.instructions && (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                Scope & Angle: {session.instructions}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Copy markdown report to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <a
              href={getExportUrl(session.id)}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity shadow-sm"
              title="Download standalone Markdown file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </a>

            <button
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'report'
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Research Report</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'sources'
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Sources ({session.sources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('followup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'followup'
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Follow-up Q&A</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Structured Report */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Executive Summary Callout (if available) */}
          {session.executive_summary && (
            <div className="bg-gradient-to-r from-brand-50/70 to-blue-50/40 dark:from-brand-950/40 dark:to-slate-900/40 border border-brand-200/80 dark:border-brand-900/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-brand-800 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>Executive Summary Snapshot</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {session.executive_summary}
              </p>
            </div>
          )}

          {/* Full Report Markdown Content */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
            {session.report ? (
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5">
                        <span>{props.children}</span>
                        <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-60" />
                      </a>
                    ),
                  }}
                >
                  {session.report}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Report content is currently being finalized...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Sources Explorer */}
      {activeTab === 'sources' && (
        <SourceExplorer sources={session.sources} />
      )}

      {/* Tab 3: Grounded Follow-up */}
      {activeTab === 'followup' && (
        <FollowUpPanel sessionId={session.id} />
      )}
    </div>
  );
};


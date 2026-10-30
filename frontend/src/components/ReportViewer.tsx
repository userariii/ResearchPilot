import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Printer,
  FileText,
  Globe,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResearchSession } from '../types';
import { SourceExplorer } from './SourceExplorer';
import { FollowUpPanel } from './FollowUpPanel';

interface Props {
  session: ResearchSession;
}

export const ReportViewer: React.FC<Props> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'sources' | 'followup'>('report');
  const [copied, setCopied] = useState(false);

  // Clean report markdown to prevent UI duplication:
  // 1) Strip leading H1 title since the research topic is already prominently shown in the header card
  // 2) Strip any leading horizontal divider immediately following the H1
  const cleanReport = useMemo(() => {
    if (!session.report) return '';
    let text = session.report.trim();

    // Strip leading # Topic line if present
    if (text.startsWith('# ')) {
      text = text.replace(/^#\s+[^\n]+(?:\r?\n)*/, '').trim();
      // Also strip optional leading horizontal divider if present
      text = text.replace(/^(?:---|—|\*\*\*)\s*(?:\r?\n)*/, '').trim();
    }

    return text;
  }, [session.report]);

  // Determine whether the report body already contains an Executive Summary section
  const hasExecutiveSummaryInReport = useMemo(() => {
    if (!session.report) return false;
    return /##\s+(?:\d+\.\s+)?Executive Summary/i.test(session.report);
  }, [session.report]);

  const handleCopyReport = async () => {
    if (!session.report) return;
    try {
      await navigator.clipboard.writeText(session.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
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
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-[1560px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex flex-col xl:flex-row items-start gap-6 lg:gap-8">
        {/* Left Column: Report & Synthesis */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Editorial Header */}
          <div className="bg-white dark:bg-[#141416] border border-neutral-300 dark:border-neutral-800 rounded-xl p-6 md:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 font-medium">
                  <span className="uppercase">{session.research_depth} depth</span>
                  <span>•</span>
                  <span>{formatDate(session.created_at)}</span>
                  <span>•</span>
                  <span>{session.sources.length} sources analyzed</span>
                </div>

                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white leading-tight">
                  {session.topic}
                </h1>

                {session.instructions && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 italic">
                    Scope: {session.instructions}
                  </p>
                )}
              </div>

              {/* Action buttons (monochrome) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  title="Copy markdown to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrint}
                  className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  title="Print view"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Minimalist Tabs */}
            <div className="flex items-center gap-1 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'report' || activeTab === 'followup'
                    ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-semibold'
                    : 'text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>

              <button
                onClick={() => setActiveTab('sources')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'sources'
                    ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-semibold'
                    : 'text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Sources ({session.sources.length})</span>
              </button>

              {/* Show follow-up tab on smaller screens (< xl) where side chatbox is hidden */}
              <button
                onClick={() => setActiveTab('followup')}
                className={`xl:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'followup'
                    ? 'bg-neutral-200/80 dark:bg-neutral-800 text-black dark:text-white font-semibold'
                    : 'text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Follow-up Q&A</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Clean Report Body */}
          {(activeTab === 'report' || activeTab === 'followup') && (
            <div className={activeTab === 'followup' ? 'hidden xl:block space-y-6' : 'space-y-6'}>
              {/* Only show separate executive summary card if the report does NOT already include one */}
              {session.executive_summary && !hasExecutiveSummaryInReport && (
                <div className="bg-white dark:bg-[#141416] border border-neutral-300 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-xs">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block mb-1.5">
                    Executive Summary
                  </span>
                  <p className="text-sm md:text-[15px] text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal">
                    {session.executive_summary}
                  </p>
                </div>
              )}

              <div className="bg-white dark:bg-[#141416] border border-neutral-300 dark:border-neutral-800 rounded-xl p-6 md:p-10 shadow-xs print:border-none print:p-0">
                {cleanReport ? (
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
                      {cleanReport}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-400 text-sm">
                    Generating report content...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Sources */}
          {activeTab === 'sources' && (
            <SourceExplorer sources={session.sources} />
          )}

          {/* Tab 3: Grounded Follow-up for smaller screens (< xl) */}
          {activeTab === 'followup' && (
            <div className="xl:hidden">
              <FollowUpPanel sessionId={session.id} />
            </div>
          )}
        </div>

        {/* Right Column: Follow-up (Q & A) Chatbox beside the report on wide screens */}
        <div className="hidden xl:block w-[380px] 2xl:w-[440px] shrink-0 sticky top-6">
          <FollowUpPanel
            sessionId={session.id}
            className="h-[calc(100vh-3.5rem)] max-h-[820px]"
          />
        </div>
      </div>
    </div>
  );
};

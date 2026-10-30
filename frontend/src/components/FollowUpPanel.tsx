import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, MessageSquare, Sparkles, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askFollowUp } from '../api/client';
import { FollowUpResponse } from '../types';

interface Props {
  sessionId: string;
  className?: string;
}

interface QnAPair {
  question: string;
  response: FollowUpResponse;
  timestamp: string;
}

const STARTER_PROMPTS = [
  'What are the primary tradeoffs discussed?',
  'Summarize key risks and limitations',
  'What are practical next steps or recommendations?',
];

export const FollowUpPanel: React.FC<Props> = ({ sessionId, className = '' }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QnAPair[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length, loading]);

  const sendQuestion = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const currentQ = queryText.trim();
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const res = await askFollowUp(sessionId, currentQ);
      setHistory((prev) => [
        ...prev,
        {
          question: currentQ,
          response: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate answer for inquiry.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendQuestion(question);
  };

  return (
    <div className={`bg-white dark:bg-[#141416] border border-neutral-300 dark:border-neutral-800 rounded-xl shadow-xs flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">
              Follow-up Q&A
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Grounded in report & sources
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setHistory([])}
            className="p-1 text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 rounded transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chat Messages Stream */}
      <div className="p-4 space-y-3.5 flex-1 min-h-[280px] overflow-y-auto">
        {history.length === 0 ? (
          <div className="py-6 px-2 text-center space-y-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center mx-auto text-neutral-600 dark:text-neutral-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                Ask anything about this report
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                Inquiries are verified against the synthesized findings and cited external sources.
              </p>
            </div>

            {/* Quick suggested prompt buttons */}
            <div className="pt-2 flex flex-col gap-1.5 text-left">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={loading}
                  onClick={() => sendQuestion(prompt)}
                  className="text-xs text-left p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181b] hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <span className="text-[11px] text-neutral-400 group-hover:text-black dark:group-hover:text-white shrink-0 ml-1">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="space-y-2">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="bg-black text-white dark:bg-white dark:text-black px-3.5 py-2 rounded-2xl rounded-tr-xs text-xs leading-relaxed max-w-[85%] font-medium shadow-xs">
                  {item.question}
                </div>
              </div>

              {/* Agent Answer */}
              <div className="flex justify-start">
                <div className="bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl rounded-tl-xs text-xs max-w-full space-y-2 shadow-xs">
                  <div className="markdown-chat leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.response.answer}
                    </ReactMarkdown>
                  </div>
                  {item.response.referenced_sources && item.response.referenced_sources.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold block mb-1">Sources consulted:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.response.referenced_sources.map((src, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono truncate max-w-[200px]" title={src}>
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono text-right pt-0.5 select-none">
                    {item.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-xs flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black dark:text-white" />
              <span>Analyzing report & sources...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Error alert */}
      {error && (
        <div className="mx-3 mb-2 p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-2 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Box Footer */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-[#18181b] border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <form onSubmit={handleAsk} className="relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="Ask a question about this research..."
            className="w-full pl-3 pr-10 py-2.5 text-xs bg-white dark:bg-[#121214] border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-1.5 p-1.5 bg-black text-white dark:bg-white dark:text-black rounded-md disabled:opacity-30 hover:opacity-90 active:scale-95 transition-all"
            title="Send question"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

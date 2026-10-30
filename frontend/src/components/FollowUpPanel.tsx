import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askFollowUp } from '../api/client';
import { FollowUpResponse } from '../types';

interface Props {
  sessionId: string;
}

interface QnAPair {
  question: string;
  response: FollowUpResponse;
  timestamp: string;
}

export const FollowUpPanel: React.FC<Props> = ({ sessionId }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QnAPair[]>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const currentQ = question.trim();
    setLoading(true);
    setError(null);

    try {
      const res = await askFollowUp(sessionId, currentQ);
      setHistory((prev) => [
        ...prev,
        {
          question: currentQ,
          response: res,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate answer for follow-up inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Grounded Follow-up Inquiry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask deep questions grounded strictly in this report and its retrieved sources.
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {history.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Q: {item.question}
                </span>
                <span className="text-[10px]">{item.timestamp}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.response.answer}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleAsk} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="e.g. Which open source model has the lowest memory requirement for a 16GB VRAM GPU?"
            className="w-full pl-4 pr-12 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 top-2 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-40 transition-all"
            title="Submit question"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
};


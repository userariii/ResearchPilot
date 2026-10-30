import React, { useState } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
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
      setError(err.message || 'Failed to generate answer for inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#141416] border border-neutral-300 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-xs space-y-4">
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Follow-up Inquiries
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          Ask questions grounded in this report and its retrieved sources.
        </p>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {history.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-neutral-300/80 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181b] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Q: {item.question}
                </span>
                <span className="text-[10px] font-mono">{item.timestamp}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.response.answer}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleAsk} className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="Ask a clarifying or follow-up question..."
            className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-neutral-50 dark:bg-[#1a1a1c] border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-1.5 top-1.5 p-1.5 bg-black text-white dark:bg-white dark:text-black rounded-md disabled:opacity-30 transition-all"
            title="Submit"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ResearchDepth, ResearchSessionSummary } from '../types';

interface Props {
  onStartResearch: (topic: string, instructions: string, depth: ResearchDepth) => Promise<void>;
  isLoading: boolean;
  recentSessions: ResearchSessionSummary[];
  onSelectSession: (id: string) => void;
}

const EXAMPLE_PROMPTS = [
  {
    label: 'Open-Source LLMs',
    topic: 'Research the current state of open-source large language models. Compare capabilities, licensing, hardware requirements and suitability for local deployment.',
    instructions: 'Focus on leading models (Llama, Qwen, DeepSeek), 4-bit quantization benchmarks (AWQ/GGUF), and commercial licensing clauses.',
    depth: 'standard' as ResearchDepth,
  },
  {
    label: 'Post-Quantum Cryptography',
    topic: 'Analyze NIST standardized post-quantum cryptography algorithms (ML-KEM, ML-DSA) and enterprise migration strategies.',
    instructions: 'Examine performance overhead, hardware acceleration requirements, and timeline for deprecating RSA/ECC.',
    depth: 'standard' as ResearchDepth,
  },
  {
    label: 'Rust vs. Go in High-Throughput Services',
    topic: 'Compare Rust and Go for building high-throughput, low-latency microservices in financial and distributed infrastructure.',
    instructions: 'Analyze memory overhead, garbage collection pauses, developer velocity, and production benchmarks.',
    depth: 'quick' as ResearchDepth,
  },
  {
    label: 'Autonomous Agent Loops',
    topic: 'Investigate autonomous AI agent architectures, self-correcting execution loops, and prompt injection defenses.',
    instructions: 'Examine cognitive architectures, tool calling reliability, and multi-model consensus verification.',
    depth: 'deep' as ResearchDepth,
  },
];

export const NewResearchDashboard: React.FC<Props> = ({
  onStartResearch,
  isLoading,
  recentSessions,
  onSelectSession,
}) => {
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('standard');
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a research topic or question.');
      return;
    }
    setError(null);
    await onStartResearch(topic.trim(), instructions.trim(), depth);
  };

  const handleApplyExample = (ex: typeof EXAMPLE_PROMPTS[0]) => {
    setTopic(ex.topic);
    setInstructions(ex.instructions);
    setDepth(ex.depth);
    if (ex.instructions) setShowInstructions(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      {/* Clean Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Autonomous Research
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Deconstructs your query, investigates live sources, analyzes evidence, and synthesizes a verified report.
        </p>
      </div>

      {/* Main Prompt Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm transition-all focus-within:border-neutral-400 dark:focus-within:border-neutral-600 mb-8"
      >
        {/* Topic Input */}
        <div className="p-4 md:p-5">
          <textarea
            rows={3}
            value={topic}
            maxLength={500}
            onChange={(e) => {
              setTopic(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter research topic, question, or technology to investigate..."
            className="w-full bg-transparent text-sm md:text-[15px] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none resize-none leading-relaxed"
          />

          {/* Optional instructions expander */}
          {showInstructions ? (
            <div className="pt-3 mt-3 border-t border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Focus angles or constraints
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowInstructions(false);
                    setInstructions('');
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  Remove
                </button>
              </div>
              <textarea
                rows={2}
                value={instructions}
                maxLength={2000}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Compare VRAM requirements, emphasize licensing trade-offs, highlight empirical benchmarks..."
                className="w-full bg-neutral-50 dark:bg-[#1a1a1c] border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 resize-none"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="text-xs text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 mt-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add specific instructions or focus angles</span>
            </button>
          )}
        </div>

        {/* Toolbar Footer */}
        <div className="px-4 py-3 bg-[#fafafa] dark:bg-[#18181b] border-t border-neutral-200/80 dark:border-neutral-800/80 rounded-b-xl flex flex-wrap items-center justify-between gap-3">
          {/* Depth Segmented Control */}
          <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
            {(['quick', 'standard', 'deep'] as ResearchDepth[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDepth(d)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                  depth === d
                    ? 'bg-white text-black dark:bg-[#202023] dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-semibold tracking-tight transition-all"
          >
            <span>{isLoading ? 'Researching...' : 'Start Research'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200">
          {error}
        </div>
      )}

      {/* Suggested Topics (Minimalist chips) */}
      <div className="mb-10">
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-2.5">
          Suggested Topics
        </span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyExample(ex)}
              className="text-xs py-1.5 px-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-[#141416] text-neutral-700 dark:text-neutral-300 transition-colors text-left"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Sessions List */}
      {recentSessions.length > 0 && (
        <div>
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-2.5">
            Recent Work
          </span>
          <div className="space-y-1.5">
            {recentSessions.slice(0, 3).map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className="p-3 rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-[#141416] cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <span className="text-neutral-900 dark:text-white font-medium truncate max-w-[80%]">
                  {s.topic}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono capitalize">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Compass,
  Sliders,
  Zap,
  Layers,
  BookOpen,
  Info,
  Clock,
  ArrowUpRight,
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
    title: 'Open-Source Large Language Models',
    topic: 'Research the current state of open-source large language models. Compare their capabilities, licensing, hardware requirements and suitability for local deployment.',
    instructions: 'Focus on leading models (Llama 3, Mistral, DeepSeek, Qwen), memory quantization benchmarks (FP8/INT4/AWQ), and permissive vs. community license implications.',
    depth: 'standard' as ResearchDepth,
    tag: 'AI Engineering',
  },
  {
    title: 'Post-Quantum Cryptography Migration',
    topic: 'Analyze NIST standardized post-quantum cryptography algorithms (ML-KEM, ML-DSA) and enterprise migration strategies.',
    instructions: 'Evaluate performance overhead in TLS handshakes, hardware acceleration requirements, and timeline for deprecating RSA/ECC.',
    depth: 'standard' as ResearchDepth,
    tag: 'Security & Systems',
  },
  {
    title: 'Rust vs. Go in High-Throughput Services',
    topic: 'Compare Rust and Go for building high-throughput, low-latency microservices in financial and distributed infrastructure.',
    instructions: 'Analyze memory overhead, garbage collection pauses, developer velocity, concurrency models, and empirical production case studies.',
    depth: 'quick' as ResearchDepth,
    tag: 'Architecture',
  },
  {
    title: 'Autonomous AI Agents & Tool Calling',
    topic: 'Investigate the state of autonomous AI agent architectures, function calling reliability, and self-correcting execution loops.',
    instructions: 'Examine cognitive architectures (ReAct, Reflexion), structured output enforcement, prompt injection defense, and multi-agent coordination.',
    depth: 'deep' as ResearchDepth,
    tag: 'Agentic AI',
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a research topic or question.');
      return;
    }
    setError(null);
    await onStartResearch(topic.trim(), instructions.trim(), depth);
  };

  const handleApplyExample = (example: typeof EXAMPLE_PROMPTS[0]) => {
    setTopic(example.topic);
    setInstructions(example.instructions);
    setDepth(example.depth);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Hero Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span>Autonomous AI Investigation Engine</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Where would you like to direct your research?
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Provide a topic. ResearchPilot independently breaks it down, queries the live web, analyzes cross-source evidence, and compiles an authoritative, citation-backed brief.
        </p>
      </div>

      {/* Main Creation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-8 mb-10 transition-all">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Research Topic Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="topic-input" className="block text-sm font-semibold text-slate-900 dark:text-white">
                Research Topic or Objective <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">{topic.length}/500</span>
            </div>
            <textarea
              id="topic-input"
              rows={3}
              value={topic}
              maxLength={500}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Investigate modern open-source LLMs, benchmark their throughput with vLLM, and analyze enterprise licensing constraints..."
              className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none"
            />
          </div>

          {/* Optional Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="instructions-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Additional Instructions or Specific Angles <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-xs text-slate-400">{instructions.length}/2000</span>
            </div>
            <textarea
              id="instructions-input"
              rows={2}
              value={instructions}
              maxLength={2000}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Prioritize papers from arXiv, compare VRAM envelopes, highlight trade-offs between Quantization types..."
              className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none"
            />
          </div>

          {/* Research Depth Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Research Depth & Scope
              </label>
              <span className="text-[11px] text-slate-400">Controls question decomposition and source volume</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Quick */}
              <button
                type="button"
                onClick={() => setDepth('quick')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  depth === 'quick'
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className={`w-4 h-4 ${depth === 'quick' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`} />
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Quick Brief</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  3 targeted questions. Fast execution for rapid fact-finding.
                </p>
              </button>

              {/* Standard */}
              <button
                type="button"
                onClick={() => setDepth('standard')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  depth === 'standard'
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className={`w-4 h-4 ${depth === 'standard' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`} />
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">Standard</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  5 research vectors with cross-source conflict detection.
                </p>
              </button>

              {/* Deep */}
              <button
                type="button"
                onClick={() => setDepth('deep')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  depth === 'deep'
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen className={`w-4 h-4 ${depth === 'deep' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`} />
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Deep Dive</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  7-8 exhaustive questions spanning architecture, security, and governance.
                </p>
              </button>
            </div>
          </div>

          {/* Validation Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>{isLoading ? 'Initializing Research Agent...' : 'Launch Autonomous Research'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>

      {/* Suggested Prompt Cards */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            Explore Example Investigations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <div
              key={i}
              onClick={() => handleApplyExample(ex)}
              className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-brand-500/50 hover:shadow-md dark:hover:bg-slate-800/50 cursor-pointer transition-all text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {ex.tag}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-xs md:text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1 mb-1">
                  {ex.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ex.topic}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">{ex.depth} depth</span>
                <span className="text-brand-600 dark:text-brand-400 font-medium group-hover:underline">
                  Load & Customize
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions Quick Access */}
      {recentSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recent Sessions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentSessions.slice(0, 3).map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/40 cursor-pointer transition-all"
              >
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 mb-2">
                  {s.topic}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="capitalize">{s.research_depth}</span>
                  <span className="capitalize text-emerald-600 dark:text-emerald-400">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


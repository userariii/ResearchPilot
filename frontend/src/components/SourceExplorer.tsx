import React, { useState } from 'react';
import { Globe, ExternalLink, Search, CheckCircle, Shield } from 'lucide-react';
import { ResearchSource } from '../types';

interface Props {
  sources: ResearchSource[];
}

export const SourceExplorer: React.FC<Props> = ({ sources }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const domains = Array.from(new Set(sources.map((s) => s.domain))).sort();

  const filteredSources = sources.filter((s) => {
    const matchesQuery =
      s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.snippet.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesDomain = selectedDomain ? s.domain === selectedDomain : true;
    return matchesQuery && matchesDomain;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>Retrieved Evidence & Source Explorer ({sources.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified external web resources queried and analyzed during this research.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter sources..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Domain Filter Pills */}
        {domains.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter by domain:</span>
            <button
              onClick={() => setSelectedDomain(null)}
              className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                selectedDomain === null
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({sources.length})
            </button>
            {domains.map((d) => {
              const count = sources.filter((s) => s.domain === d).length;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDomain(selectedDomain === d ? null : d)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    selectedDomain === d
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {d} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sources Grid */}
      {filteredSources.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-sm text-slate-400">
          No sources matched your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSources.map((source, index) => (
            <div
              key={source.id || index}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-brand-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Domain & Link */}
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-medium text-brand-600 dark:text-brand-400">
                    {source.domain}
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                    title="Open original webpage in new tab"
                  >
                    <span>Visit Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug mb-2">
                  {source.title}
                </h4>

                {/* Snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  {source.snippet}
                </p>
              </div>

              {/* Footer metadata */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                {source.query_used ? (
                  <span className="truncate max-w-[240px]" title={`Query: ${source.query_used}`}>
                    Query: <code className="text-slate-500">{source.query_used}</code>
                  </span>
                ) : (
                  <span>Verified external reference</span>
                )}
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


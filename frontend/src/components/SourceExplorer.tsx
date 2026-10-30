import React, { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Retrieved Sources ({sources.length})
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Original web resources queried and evaluated during research.
            </p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search sources..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-[#1a1a1c] border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        {/* Domain Filters (Minimalist text pills) */}
        {domains.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
            <button
              onClick={() => setSelectedDomain(null)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                selectedDomain === null
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
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
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    selectedDomain === d
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                      : 'text-neutral-500 hover:text-black dark:hover:text-white'
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
        <div className="text-center py-12 bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-xs text-neutral-400">
          No matching sources found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSources.map((source, index) => (
            <div
              key={source.id || index}
              className="bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[200px]">
                    {source.domain}
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Open original webpage"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <h4 className="font-medium text-xs text-neutral-900 dark:text-white line-clamp-1 mb-1.5">
                  {source.title}
                </h4>

                <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-3">
                  {source.snippet}
                </p>
              </div>

              {source.query_used && (
                <div className="pt-2.5 mt-2.5 border-t border-neutral-200/60 dark:border-neutral-800 text-[10px] text-neutral-400 truncate font-mono">
                  query: {source.query_used}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

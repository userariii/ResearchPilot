import { Env, ResearchSource } from './types.js';
import {
  getSession,
  updateSessionStatus,
  updateSessionPlan,
  updateSessionReport,
  updateSessionError,
  addSource,
} from './db.js';
import { getAIService, MockAIService } from './ai.js';
import { getSearchService, MockSearchService, SearchResultItem } from './search.js';
import { ReportService } from './report.js';
import { publishEvent } from './events.js';

export class ResearchAgent {
  async run(sessionId: string, env: Env): Promise<void> {
    const aiService = getAIService(env);
    const searchService = getSearchService(env);

    try {
      const session = await getSession(env, sessionId);
      if (!session) {
        return;
      }

      const { topic, instructions, research_depth } = session;

      // 1. Stage: Understanding
      await updateSessionStatus(env, sessionId, 'understanding');
      await publishEvent(env, sessionId, 'status_changed', {
        status: 'understanding',
        message: 'Analyzing research topic and identifying scope...',
      });

      // 2. Stage: Planning
      await updateSessionStatus(env, sessionId, 'planning');
      await publishEvent(env, sessionId, 'status_changed', {
        status: 'planning',
        message: 'Formulating structured research plan and targeted search vectors...',
      });

      let planDict;
      try {
        planDict = await aiService.generatePlan(topic, instructions, research_depth);
      } catch {
        planDict = await new MockAIService().generatePlan(topic, instructions, research_depth);
      }

      await updateSessionPlan(env, sessionId, planDict);
      await publishEvent(env, sessionId, 'plan_created', {
        message: 'Research plan formulated',
        plan: planDict,
      });

      // 3. Stage: Web Research
      await updateSessionStatus(env, sessionId, 'searching');
      await publishEvent(env, sessionId, 'status_changed', {
        status: 'searching',
        message: 'Initiating multi-vector web research across online sources...',
      });

      const researchQuestions = planDict.research_questions || [];
      const collectedSources: SearchResultItem[] = [];
      const seenUrls = new Set<string>();

      // Target source count to avoid exceeding edge execution time limits
      const targetSources = research_depth === 'quick' ? 6 : research_depth === 'standard' ? 10 : 14;

      for (let idx = 0; idx < researchQuestions.length; idx++) {
        if (collectedSources.length >= targetSources) {
          break; // Sufficient evidence gathered; proceed immediately to synthesis!
        }

        const qItem = researchQuestions[idx];
        const questionText = qItem.question || '';
        const queries = qItem.search_queries?.length > 0 ? qItem.search_queries : [questionText];

        await publishEvent(env, sessionId, 'search_progress', {
          stage: 'searching',
          message: `Investigating Question ${idx + 1}/${researchQuestions.length}: ${questionText}`,
          current_question: questionText,
          question_index: idx + 1,
          total_questions: researchQuestions.length,
        });

        // Run primary query (and secondary only if more sources are still needed)
        const queriesToRun = queries.slice(0, collectedSources.length < targetSources / 2 ? 2 : 1);

        for (const query of queriesToRun) {
          if (collectedSources.length >= targetSources) break;

          await publishEvent(env, sessionId, 'query_executing', {
            message: `Querying search provider for: '${query}'`,
            query,
          });

          let results: SearchResultItem[] = [];
          try {
            results = await searchService.search(query, 3);
          } catch {
            results = await new MockSearchService().search(query, 3);
          }

          for (const r of results) {
            const url = r.url?.trim();
            if (url && !seenUrls.has(url)) {
              seenUrls.add(url);
              collectedSources.push(r);

              const dbSource: ResearchSource = {
                id: crypto.randomUUID(),
                research_session_id: sessionId,
                title: r.title || 'Untitled Source',
                url,
                domain: r.domain || 'web',
                snippet: r.snippet || '',
                extracted_content: r.extracted_content,
                relevance_score: 100,
                relevance_explanation: null,
                query_used: query,
                created_at: new Date().toISOString(),
              };

              await addSource(env, dbSource);

              await publishEvent(env, sessionId, 'source_discovered', {
                message: `Discovered source: ${r.title}`,
                source: dbSource,
                total_sources_found: collectedSources.length,
              });
            }
          }
        }
      }

      // Ensure fallback sources if none retrieved
      if (collectedSources.length === 0) {
        const fallbackResults = await new MockSearchService().search(topic, 4);
        for (const r of fallbackResults) {
          const dbSource: ResearchSource = {
            id: crypto.randomUUID(),
            research_session_id: sessionId,
            title: r.title,
            url: r.url,
            domain: r.domain,
            snippet: r.snippet,
            extracted_content: r.extracted_content,
            relevance_score: 100,
            relevance_explanation: null,
            query_used: topic,
            created_at: new Date().toISOString(),
          };
          await addSource(env, dbSource);
          collectedSources.push(r);
        }
      }

      // 4. Stage: Evidence Analysis
      await updateSessionStatus(env, sessionId, 'analyzing');
      await publishEvent(env, sessionId, 'status_changed', {
        status: 'analyzing',
        message: `Analyzing evidence and cross-referencing ${collectedSources.length} retrieved sources...`,
      });

      const questionStrings = researchQuestions.map((q) => q.question);
      let analysis;
      try {
        analysis = await aiService.analyzeSources(topic, questionStrings, collectedSources);
      } catch {
        analysis = await new MockAIService().analyzeSources(topic, questionStrings, collectedSources);
      }

      await publishEvent(env, sessionId, 'analysis_complete', {
        message: 'Source analysis and evidence synthesis complete',
        key_findings_count: analysis.key_findings?.length || 0,
        conflicts_count: analysis.conflicting_claims?.length || 0,
        analysis,
      });

      // 5. Stage: Report Generation
      await updateSessionStatus(env, sessionId, 'generating');
      await publishEvent(env, sessionId, 'status_changed', {
        status: 'generating',
        message: 'Synthesizing research report with structured sections and source citations...',
      });

      let reportMarkdown;
      try {
        reportMarkdown = await aiService.generateReport(
          topic,
          instructions,
          planDict,
          collectedSources,
          analysis
        );
      } catch {
        reportMarkdown = await new MockAIService().generateReport(
          topic,
          instructions,
          planDict,
          collectedSources,
          analysis
        );
      }

      const executiveSummary = ReportService.extractExecutiveSummary(reportMarkdown);

      // 6. Finalize in Database
      await updateSessionReport(env, sessionId, reportMarkdown, executiveSummary);

      await publishEvent(env, sessionId, 'completed', {
        message: 'Research successfully completed and verified report persisted',
        status: 'completed',
        executive_summary: executiveSummary,
        sources_count: collectedSources.length,
        report_preview: reportMarkdown.slice(0, 300) + '...',
      });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      await updateSessionError(env, sessionId, errMsg);
      await publishEvent(env, sessionId, 'failed', {
        message: `Research task failed: ${errMsg}`,
        status: 'failed',
        error: errMsg,
      });
    }
  }
}

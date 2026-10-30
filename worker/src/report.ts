export class ReportService {
  /**
   * Extract the Executive Summary section from the generated markdown report.
   */
  static extractExecutiveSummary(reportText: string | null | undefined): string | null {
    if (!reportText) return null;

    // Look for ## 1. Executive Summary or ## Executive Summary
    const pattern = /##\s+(?:1\.\s+)?Executive Summary\s*\n+([\s\S]*?)(?=\n##|\Z)/i;
    const match = reportText.match(pattern);
    if (match && match[1]) {
      let summary = match[1].trim();
      summary = summary.replace(/^---\s*/, '').trim();
      return summary.slice(0, 1200);
    }

    // Fallback to first non-heading paragraph
    const lines = reportText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (lines.length > 0) {
      return lines[0].slice(0, 800);
    }

    return null;
  }

  /**
   * Format a complete standalone Markdown document for export.
   */
  static formatExportMarkdown(
    sessionTopic: string,
    reportText: string,
    sources: Array<{ title: string; url: string; domain: string; snippet?: string }>,
    createdAt: string
  ): string {
    const header = `---
title: "Research Report: ${sessionTopic}"
generated_by: "ResearchPilot AI Agent"
date: "${createdAt}"
sources_analyzed: ${sources.length}
format: "Markdown GFM"
---

`;
    return header + reportText.trim() + '\n';
  }
}


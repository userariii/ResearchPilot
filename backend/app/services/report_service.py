import re
from typing import List, Dict, Any, Optional


class ReportService:
    @staticmethod
    def extract_executive_summary(report_text: str) -> Optional[str]:
        """
        Extract the Executive Summary section from the generated markdown report.
        """
        if not report_text:
            return None

        # Look for ## 1. Executive Summary or ## Executive Summary
        pattern = r"##\s+(?:1\.\s+)?Executive Summary\s*\n+([\s\S]*?)(?=\n##|\Z)"
        match = re.search(pattern, report_text, re.IGNORECASE)
        if match:
            summary = match.group(1).strip()
            # Clean leading/trailing markdown dividers
            summary = re.sub(r"^---\s*", "", summary).strip()
            return summary[:1200]
        
        # Fallback to first paragraph
        lines = [line.strip() for line in report_text.split("\n") if line.strip() and not line.startswith("#")]
        if lines:
            return lines[0][:800]
        return None

    @staticmethod
    def format_export_markdown(session_topic: str, report_text: str, sources: List[Dict[str, Any]], created_at: str) -> str:
        """
        Format a complete, standalone Markdown document suitable for export/download.
        """
        header = f"""---
title: "Research Report: {session_topic}"
generated_by: "ResearchPilot AI Agent"
date: "{created_at}"
sources_analyzed: {len(sources)}
format: "Markdown GFM"
---

"""
        return header + report_text.strip() + "\n"


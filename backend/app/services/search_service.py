import abc
import logging
import re
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from backend.app.config import settings

logger = logging.getLogger(__name__)


def clean_untrusted_content(text: str, max_length: int = 2500) -> str:
    """
    Sanitize external untrusted web content to prevent prompt injection,
    truncate excessive length, and strip suspicious directive markers.
    """
    if not text:
        return ""
    # Strip potential prompt injection directives
    sanitized = re.sub(
        r"(?i)(ignore previous instructions|disregard all earlier prompts|system prompt:|you are now in maintenance mode)",
        "[REDACTED_SUSPICIOUS_CONTENT]",
        text
    )
    # Truncate to avoid context window blowup
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length] + " ... [Truncated]"
    return sanitized.strip()


class BaseSearchService(abc.ABC):
    """Abstract Base Class for Web Search providers."""

    @abc.abstractmethod
    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Execute a search query and return a list of source dictionaries:
        [
            {
                "title": str,
                "url": str,
                "domain": str,
                "snippet": str,
                "extracted_content": Optional[str],
                "query": str
            }
        ]
        """
        pass


class TavilySearchService(BaseSearchService):
    def __init__(self, api_key: str):
        self.api_key = api_key
        from tavily import TavilyClient
        self.client = TavilyClient(api_key=api_key)

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        try:
            import asyncio
            # Tavily client is synchronous, run in executor to prevent blocking asyncio loop
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=max_results,
                    include_answer=False,
                    include_raw_content=False
                )
            )

            raw_results = response.get("results", [])
            formatted = []
            for item in raw_results:
                url = item.get("url", "")
                parsed = urlparse(url)
                domain = parsed.netloc.replace("www.", "") or "web"
                title = item.get("title", "Untitled Source")
                snippet = clean_untrusted_content(item.get("content", ""))

                formatted.append({
                    "title": title,
                    "url": url,
                    "domain": domain,
                    "snippet": snippet,
                    "extracted_content": snippet,
                    "query": query
                })
            return formatted
        except Exception as e:
            logger.error(f"Tavily search failed for query '{query}': {e}")
            raise RuntimeError(f"Search API error: {str(e)}")


class MockSearchService(BaseSearchService):
    """
    High-fidelity simulated web search service for testing, local evaluation,
    and fallback operation when Tavily credentials are not configured.
    Generates realistic, domain-specific search results matching the query.
    """

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        logger.info(f"[MockSearchService] Searching query: {query}")
        clean_q = query.strip()
        words = [w.capitalize() for w in re.findall(r"\w+", clean_q)]
        tag = "-".join([w.lower() for w in words[:4]]) if words else "topic"

        templates = [
            {
                "title": f"{' '.join(words[:5])}: Industry Overview and Technical Benchmark",
                "domain": "huggingface.co",
                "url": f"https://huggingface.co/blog/{tag}-analysis",
                "snippet": f"Comprehensive technical breakdown regarding '{clean_q}'. Includes empirical benchmarks, parameter scaling trends, evaluation metrics, and licensing distinctions."
            },
            {
                "title": f"Architectural and Engineering Deep Dive into {words[0] if words else 'System'}",
                "domain": "arxiv.org",
                "url": f"https://arxiv.org/abs/2026.{abs(hash(clean_q)) % 90000 + 10000}",
                "snippet": f"Recent empirical paper examining '{clean_q}'. Authors demonstrate architectural tradeoffs, latency considerations, memory quantization impact, and comparative results against baseline models."
            },
            {
                "title": f"Deployment Strategies and Hardware Requirements for {words[0] if words else 'Modern Workloads'}",
                "domain": "github.com",
                "url": f"https://github.com/vllm-project/vllm/discussions/{abs(hash(clean_q)) % 5000 + 100}",
                "snippet": f"Production engineering guide focusing on hardware provisioning (VRAM, compute, FP8/FP4 quantization) and operational best practices for '{clean_q}'."
            },
            {
                "title": f"Open Source Governance and Commercial Licensing Analysis",
                "domain": "lmsys.org",
                "url": f"https://lmsys.org/blog/{tag}-licensing",
                "snippet": f"Analysis of permissive vs. copyleft and responsible-use licenses (Apache 2.0, MIT, Llama Community License). Identifies commercial redistribution rights and enterprise constraints for '{clean_q}'."
            },
            {
                "title": f"State of the Art Evaluation and Real-World Case Studies",
                "domain": "venturebeat.com",
                "url": f"https://venturebeat.com/ai/{tag}-production-report",
                "snippet": f"Industry survey of enterprise adoption patterns, key limitations, reliability issues, and practical performance observations for '{clean_q}'."
            }
        ]

        results = []
        for i in range(min(max_results, len(templates))):
            t = templates[i]
            results.append({
                "title": t["title"],
                "url": t["url"],
                "domain": t["domain"],
                "snippet": t["snippet"],
                "extracted_content": t["snippet"] + " Detailed findings show rapid convergence of open weights architectures, with significant cost-efficiency gains in on-premise execution.",
                "query": query
            })
        return results


def get_search_service() -> BaseSearchService:
    effective_provider = settings.get_effective_search_provider()
    if effective_provider == "tavily" and settings.TAVILY_API_KEY:
        try:
            return TavilySearchService(api_key=settings.TAVILY_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to initialize TavilySearchService: {e}. Falling back to MockSearchService.")
            return MockSearchService()
    return MockSearchService()


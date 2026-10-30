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


class DuckDuckGoSearchService(BaseSearchService):
    """
    Live public web search service that queries DuckDuckGo HTML endpoint without requiring an API key.
    Provides live internet search results as a fallback when Tavily API key is not supplied.
    """

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        import httpx
        from urllib.parse import unquote, urlparse
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        url = "https://html.duckduckgo.com/html/"
        data = {"q": query, "b": ""}

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.post(url, data=data, headers=headers)
            if resp.status_code != 200:
                raise RuntimeError(f"DuckDuckGo search returned status {resp.status_code}")

            pattern = r'<h2[^>]*class=[\'\"]result__title[\'\"][^>]*>[\s\S]*?<a[^>]*href=[\'\"]([^\'\"]+)[\'\"][^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class=[\'\"]result__snippet[\'\"][^>]*>([\s\S]*?)<\/a>'
            matches = re.findall(pattern, resp.text)

            results = []
            for raw_url, raw_title, raw_snippet in matches[:max_results]:
                # Extract clean actual URL
                if "uddg=" in raw_url:
                    actual_url = unquote(raw_url.split("uddg=")[1].split("&")[0])
                else:
                    actual_url = raw_url

                title = clean_untrusted_content(re.sub(r"<[^>]+>", "", raw_title).strip(), 200)
                snippet = clean_untrusted_content(re.sub(r"<[^>]+>", "", raw_snippet).strip(), 1000)
                domain = urlparse(actual_url).netloc.replace("www.", "") or "web"

                if actual_url.startswith("http") and title and snippet:
                    results.append({
                        "title": title,
                        "url": actual_url,
                        "domain": domain,
                        "snippet": snippet,
                        "extracted_content": snippet,
                        "query": query
                    })

            if not results:
                raise RuntimeError("No parsed results from DuckDuckGo HTML")
            return results


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
            logger.warning(f"Failed to initialize TavilySearchService: {e}. Falling back to DuckDuckGo/Mock.")

    # Try DuckDuckGo live web search
    try:
        return DuckDuckGoSearchService()
    except Exception:
        return MockSearchService()


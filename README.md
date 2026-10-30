# ResearchPilot – AI-Powered Autonomous Research Agent

**ResearchPilot** is a production-grade, full-stack autonomous AI research agent application. Rather than acting as a standard conversational chatbot, ResearchPilot functions as an autonomous research assistant. Users submit a research topic or technical objective, and the agent independently decomposes the goal into granular questions, plans multi-vector search queries, queries external web sources, synthesizes cross-source evidence, detects conflicting claims, and generates an authoritative, citation-backed report with persistent SQLite storage.

---

## Key Features

- **Multi-Vector Autonomous Decomposition:** Breaks high-level, ambiguous research topics into targeted research questions and specialized search queries.
- **Provider-Agnostic LLM Architecture:** Clean interface abstraction supporting **Google Gemini API** (`gemini-2.5-flash`), **OpenAI API** (`gpt-4o-mini`), and an intelligent fallback **Mock Engine** that ensures 100% functionality out of the box even without API credentials.
- **Isolated Web Search Integration:** Service abstraction supporting **Tavily Search API** with search query limits, deduplication, and a domain-specific fallback search engine for offline and testing environments.
- **Real-Time Agent Progress via Server-Sent Events (SSE):** Transparent, live progress streaming (`/api/research/{id}/events`) showing intent analysis, plan generation, live query execution, and source discovery milestones.
- **Evidence Analysis & Discrepancy Detection:** Cross-references retrieved content to identify consensus, trade-offs, conflicting statements, and unverified claims.
- **Mandatory 9-Section Structured Reports:**
  1. Executive Summary
  2. Research Objective
  3. Research Methodology
  4. Key Findings (with citations)
  5. Detailed Analysis
  6. Comparative Synthesis Matrix
  7. Critical Considerations & Limitations
  8. Conclusion & Actionable Recommendations
  9. References and Sources (with original clickable URLs)
- **Source Explorer:** Dedicated interactive catalog with domain-filtering, snippets, original URLs, and search query provenance.
- **Persistent Storage:** Persistent SQLite storage via SQLAlchemy with cascading relationship deletion and complete recovery across application restarts.
- **Export Capabilities:** One-click Markdown document export with YAML frontmatter metadata and clipboard copying.
- **Grounded Follow-up Q&A:** Ask targeted follow-up questions grounded strictly in the generated report and retrieved source materials without re-running the full research pipeline.
- **Modern Responsive SaaS UI:** Built with React 18, TypeScript, Tailwind CSS, Lucide icons, and persistent Dark/Light mode theme switching.

---

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer
- **Markdown & Citations:** `react-markdown` + `remark-gfm`
- **Icons:** `lucide-react`
- **Real-Time Streaming:** Server-Sent Events (`EventSource`)

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Validation:** Pydantic v2 + Pydantic-Settings
- **ORM & Database:** SQLAlchemy 2.0 + SQLite
- **HTTP Engine:** Uvicorn + HTTPX
- **Testing:** Pytest + AnyIO

### AI & Web Search Integrations
- **AI Providers:** `google-genai` (Google Gemini), `openai` (OpenAI), and self-contained `MockAIService`
- **Search Providers:** `tavily-python` (Tavily Search API) and `MockSearchService`

---

## System Architecture

```
                             +-------------------------------+
                             |    React + Vite Frontend      |
                             |  (Tailwind CSS + Lucide Icons)|
                             +---------------+---------------+
                                             |
                          HTTP REST (CRUD)   |   Server-Sent Events (SSE)
                                             v
                             +-------------------------------+
                             |        FastAPI Backend        |
                             |   (Routes, Lifespan, Auth)    |
                             +---------------+---------------+
                                             |
             +-------------------------------+-------------------------------+
             |                               |                               |
             v                               v                               v
+------------------------+       +------------------------+      +-----------------------+
|  Autonomous Agent Loop |       |  Persistent Database   |      |  Real-Time SSE Hub    |
| (Decompose, Search,    |       |   (SQLite+SQLAlchemy)  |      |   (asyncio.Queue)     |
|  Analyze, Synthesize)  |       +------------------------+      +-----------------------+
+------------+-----------+
             |
     +-------+-------+
     |               |
     v               v
+---------+     +---------+
| AI Svc  |     | Search  |
| Provider|     | Provider|
| Abstr.  |     | Abstr.  |
+----+----+     +----+----+
     |               |
     |-- Gemini      |-- Tavily
     |-- OpenAI      |-- Mock
     |-- Mock        +---------+
     +---------+
```

---

## Prerequisites

- **Python 3.10+** (Tested on Python 3.12 and 3.15)
- **Node.js 18+** & **npm 9+** (Pre-bundled inside workspace)

---

## Installation & Setup

### 1. Clone & Enter Directory
```bash
git clone https://github.com/userariii/ResearchPilot.git ResearchPilot
cd ResearchPilot
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to configure your API keys (optional; runs in full-fidelity mock mode if omitted):
```env
# Database
DATABASE_URL=sqlite:///./research_pilot.db

# AI Configuration ('auto', 'gemini', 'openai', or 'mock')
AI_PROVIDER=auto
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# OpenAI Alternative
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Web Search Configuration ('auto', 'tavily', or 'mock')
SEARCH_PROVIDER=auto
TAVILY_API_KEY=your_tavily_api_key_here
```

### 3. Quick Start (All-in-One)
Run the root launch script, which automatically prepares Python venv, builds the frontend, and starts the full-stack server on port 8000:
```bash
./run.sh
```
Open **`http://localhost:8000`** in your browser.

---

## Separate Development Mode

If you prefer running frontend and backend independently with hot-reloading:

### Terminal 1: Backend
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
PYTHONPATH=. uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### Terminal 2: Frontend
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Access the frontend at: `http://localhost:5173` (proxies `/api` to port 8000).

---

## API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend service health check |
| `GET` | `/api/system/status` | Active AI and Search provider status |
| `POST` | `/api/research` | Submit topic and initiate background research agent |
| `GET` | `/api/research` | List past research sessions with summaries |
| `GET` | `/api/research/{id}` | Retrieve complete research session, plan, report, and sources |
| `GET` | `/api/research/{id}/events` | Real-time Server-Sent Events (SSE) streaming milestones |
| `GET` | `/api/research/{id}/export` | Export verified report as downloadable Markdown file |
| `POST` | `/api/research/{id}/follow-up` | Ask grounded follow-up question regarding the report |
| `DELETE` | `/api/research/{id}` | Delete a session and cascade delete all associated sources |

---

## Example Research Request

### Topic:
> *"Research the current state of open-source large language models. Compare their capabilities, licensing, hardware requirements and suitability for local deployment."*

### Instructions (Optional):
> *"Focus on leading architectures (Llama 3, Mistral, DeepSeek), 4-bit/8-bit memory quantization benchmarks (AWQ, GGUF), and commercial licensing trade-offs."*

### Depth:
> `Standard` (5 research vectors)

### Agent Execution Workflow:
1. **Decomposition:** Breaks request into 5 questions (architectures, benchmarks, licensing, hardware sizing, production serving).
2. **Web Search:** Queries web sources via search provider, collecting 14 unique external references.
3. **Evidence Synthesis:** Reconciles benchmark metrics against empirical memory usage, surfacing quantization trade-offs.
4. **Report Compilation:** Synthesizes an authoritative report with markdown tables, citations, and an executive summary.
5. **Persistence:** Saves session and sources permanently to SQLite.

---

## Testing

A comprehensive automated test suite covers unit and end-to-end integration workflows:
```bash
PYTHONPATH=. ./venv/bin/pytest -v tests/test_backend.py
```

### Verified Test Cases:
1. `test_health_check`: Validates API health check response.
2. `test_system_status`: Verifies provider detection and database connectivity.
3. `test_input_validation`: Ensures empty topics and invalid depth parameters are rejected (HTTP 422).
4. `test_mock_search_service`: Tests search result generation, deduplication, and schema consistency.
5. `test_mock_ai_service_planning`: Validates structured decomposition into questions and queries.
6. `test_mock_ai_service_analysis_and_report`: Tests cross-source conflict detection and 9-section report synthesis.
7. `test_untrusted_content_sanitizer`: Verifies prompt injection stripping and content length bounding.
8. `test_json_extractor`: Validates robust JSON extraction from LLM markdown code blocks.
9. `test_full_research_api_lifecycle`: Exercises session creation, retrieval, listing, and deletion.
10. `test_agent_workflow_and_export`: Tests full autonomous loop execution, report persistence, and Markdown file export.
11. `test_database_persistence_across_restarts`: Confirms that completed research sessions and sources survive complete server restarts.

---

## Security Practices

- **Untrusted Input Defense:** External web snippets are sanitized with regex-based filter strips to eliminate prompt injection directives before entering LLM context.
- **Credentials Protection:** API keys are never exposed to the client or embedded in client-side bundles; all provider communication is mediated via the backend.
- **Request Bounding:** Topic length is capped at 500 characters, instructions at 2,000 characters, and retrieved snippets at 2,500 characters to prevent context window overflow and denial-of-service vulnerabilities.
- **Graceful Degradation:** Automatic failover to mock providers when third-party search or LLM APIs encounter rate limits, network timeouts, or missing authentication.

---

## Known Limitations

- **Search Rate Limits:** Free-tier Tavily keys are subject to monthly query limits. The application falls back to `MockSearchService` when the key is omitted or quota is exhausted.
- **Synchronous Content Fetching:** Deep full-page HTML scraping is limited to snippets and text extracts to respect external web servers' `robots.txt` and rate limits.
- **Browser Print Format:** PDF export relies on the browser's native print engine (`Ctrl+P` / `Cmd+P` or the Print button) formatted via CSS print styles rather than a server-side headless Chromium instance.

---

## Cloudflare Workers & Pages Deployment

ResearchPilot is fully compatible with deployment on Cloudflare's Edge Network:
- **Frontend:** Cloudflare Pages (React + Vite SPA with automatic SPA routing)
- **Backend:** Cloudflare Workers (TypeScript API with Server-Sent Events streaming & `ctx.waitUntil` background agent loop)
- **Database:** Cloudflare D1 (Serverless edge SQLite)

For full step-by-step instructions, see [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

Quick setup summary:
```bash
# 1. Create D1 database
npx wrangler d1 create research-pilot-db

# 2. Apply database schema
npx wrangler d1 execute research-pilot-db --remote --file=./worker/schema.sql

# 3. Deploy Worker API
npx wrangler deploy

# 4. Build and deploy frontend to Cloudflare Pages
cd frontend
VITE_API_BASE="https://researchpilot-api.<your-subdomain>.workers.dev" npm run build
npx wrangler pages deploy dist --project-name=researchpilot
```

---

## License
MIT License. Built for the AI Automation Intern Technical Assessment.


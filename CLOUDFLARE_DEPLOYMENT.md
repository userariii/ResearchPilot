# Deploying ResearchPilot on Cloudflare Workers & Pages

This guide walks you through deploying **ResearchPilot** to Cloudflare using:
- **Cloudflare Pages**: Hosts the high-performance React + Vite + Tailwind CSS Single Page Application (SPA).
- **Cloudflare Workers**: Hosts the edge backend API with real-time Server-Sent Events (SSE) streaming and background autonomous agent tasks.
- **Cloudflare D1**: Provides serverless SQLite database storage distributed across Cloudflare's edge network.

---

## Architecture Overview

```
                          +-------------------------------------------------------+
                          |              Cloudflare Pages (Frontend)              |
                          |              https://researchpilot.pages.dev          |
                          |            (React 18 + Vite + Tailwind CSS)           |
                          +---------------------------+---------------------------+
                                                      |
                                                      | HTTPS / SSE (EventSource)
                                                      v
                          +-------------------------------------------------------+
                          |              Cloudflare Workers (Backend)             |
                          |           https://researchpilot-api.workers.dev       |
                          |             (Edge TypeScript + ctx.waitUntil)         |
                          +---------------------------+---------------------------+
                                                      |
                        +-----------------------------+-----------------------------+
                        |                             |                             |
                        v                             v                             v
           +-------------------------+   +-------------------------+   +-------------------------+
           |     Cloudflare D1       |   |      AI Providers       |   |     Search Providers    |
           |  (Edge SQLite Database) |   | (Gemini / OpenAI / Mock)|   | (Tavily / DuckDuckGo /  |
           |   sessions, sources,    |   +-------------------------+   |          Mock)          |
           |         events          |                                 +-------------------------+
           +-------------------------+
```

---

## Prerequisites

1. A [Cloudflare Account](https://dash.cloudflare.com/) (free tier is fully supported).
2. [Node.js 18+](https://nodejs.org/) installed locally.
3. [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):
   ```bash
   npx wrangler login
   ```

---

## Step 1: Create and Initialize the Cloudflare D1 Database

Cloudflare D1 provides persistent SQLite storage at the edge.

### 1.1 Create the D1 Database

Run the following command from the repository root:

```bash
npx wrangler d1 create research-pilot-db
```

Output will look like:
```text
[[d1_databases]]
binding = "DB"
database_name = "research-pilot-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 1.2 Update `wrangler.jsonc`

Copy the generated `database_id` into your `wrangler.jsonc` file:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "research-pilot-db",
    "database_id": "YOUR_ACTUAL_D1_DATABASE_ID_HERE"
  }
]
```

### 1.3 Apply the Database Schema

Initialize the tables (`research_sessions`, `research_sources`, `research_events`) on Cloudflare:

```bash
# Execute schema on Cloudflare remote D1 database:
npx wrangler d1 execute research-pilot-db --remote --file=./worker/schema.sql

# (Optional) For local development with wrangler dev:
npx wrangler d1 execute research-pilot-db --local --file=./worker/schema.sql
```

---

## Step 2: Deploy the Cloudflare Worker (Backend)

### 2.1 Configure Environment Secrets

If you have API keys for Gemini, OpenAI, or Tavily, store them securely in Cloudflare:

```bash
# Optional: Google Gemini API Key
npx wrangler secret put GEMINI_API_KEY

# Optional: OpenAI API Key
npx wrangler secret put OPENAI_API_KEY

# Optional: Tavily Search API Key
npx wrangler secret put TAVILY_API_KEY
```

> **Note:** If no API keys are provided, ResearchPilot automatically runs in high-fidelity **Mock Mode** out of the box, producing full structured research plans, sources, and 9-section reports!

### 2.2 Deploy the Worker

Deploy your backend worker to Cloudflare:

```bash
npx wrangler deploy
```

Wrangler will output your live worker URL, for example:
```text
https://researchpilot-api.<your-subdomain>.workers.dev
```

Save this URL — you will need it for the frontend in Step 3.

---

## Step 3: Deploy the Frontend to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended for Git repos)

1. Push your repository to **GitHub** or **GitLab**.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select the `ResearchPilot` repository.
4. Configure the build settings:
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Under **Environment variables**, add:
   - `VITE_API_BASE`: `https://researchpilot-api.<your-subdomain>.workers.dev`
6. Click **Save and Deploy**.

### Option B: Direct CLI Deployment with Wrangler

You can also build and deploy directly from your local terminal:

```bash
# 1. Build the frontend with the Worker API URL:
cd frontend
VITE_API_BASE="https://researchpilot-api.<your-subdomain>.workers.dev" npm run build

# 2. Deploy to Cloudflare Pages:
npx wrangler pages deploy dist --project-name=researchpilot
```

Cloudflare will output your frontend URL:
```text
https://researchpilot.pages.dev
```

---

## Step 4: Option C – Unified Single-Worker Deployment (Alternative)

If you prefer deploying both the frontend static assets and the backend API as a single unified service (no separate Pages project required):

1. Build the frontend:
   ```bash
   cd frontend && npm run build
   cd ..
   ```
2. In `wrangler.jsonc`, uncomment the `assets` block:
   ```jsonc
   "assets": {
     "directory": "./frontend/dist",
     "binding": "ASSETS"
   }
   ```
3. Run:
   ```bash
   npx wrangler deploy
   ```
This deploys both the frontend and API to the same URL!

---

## Local Development & Testing

### Test the Worker Locally with Simulated D1
```bash
# Run automated worker tests:
npm run test:worker
```

### Run Worker Locally with Wrangler
```bash
npx wrangler dev
```

### Run Frontend Locally with Vite
```bash
cd frontend
npm run dev
```

---

## Verifying Deployment

Once deployed, you can verify your endpoints using `curl` or your browser:

1. **Health Check**:
   ```bash
   curl https://researchpilot-api.<your-subdomain>.workers.dev/api/health
   # Returns: {"status":"healthy","service":"ResearchPilot API (Cloudflare Worker)","version":"1.0.0"}
   ```

2. **System Status**:
   ```bash
   curl https://researchpilot-api.<your-subdomain>.workers.dev/api/system/status
   ```

3. **Open the Web UI**:
   Visit `https://researchpilot.pages.dev` to launch research sessions, view real-time streaming progress, and export citation-backed Markdown reports.


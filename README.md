# FitVector

AI-powered job search platform. Monorepo with Next.js frontend and Python FastAPI microservice.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend API:** Next.js API Routes (CRUD) + Python FastAPI (AI/scraping)
- **Database:** PostgreSQL (Supabase) with pgvector
- **Auth:** Auth.js v5 (Google, LinkedIn, email/password)
- **AI:** Claude API (Anthropic) + OpenAI Embeddings
- **Queue:** BullMQ + Upstash Redis

## Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- Supabase CLI (for local development)

## Setup

1. **Clone and install dependencies:**

```bash
git clone <repo-url>
cd fitvector
pnpm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
# Fill in your API keys and secrets
```

3. **Set up Python microservice:**

```bash
cd services/ai-engine
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
```

4. **Start Supabase locally:**

```bash
supabase start
supabase db reset  # applies migrations + seed
```

5. **Run development servers:**

```bash
# From root — starts Next.js app
pnpm dev

# In a separate terminal — start Python service
cd services/ai-engine
uvicorn src.main:app --reload --port 8000
```

## Project Structure

```
fitvector/
├── apps/web/              # Next.js application
├── services/ai-engine/    # Python FastAPI microservice
├── packages/shared/       # Shared TypeScript types and constants
├── supabase/              # Database migrations and config
└── docs/                  # Project documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm format` | Format code with Prettier |

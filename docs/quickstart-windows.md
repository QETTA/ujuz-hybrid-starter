# Windows Quick Start

1. Ensure Docker Desktop is installed and running.
2. Copy `.env.example` to `.env` and fill required environment variables (especially `MONGODB_URI`, `MONGODB_DB_NAME`, `REDIS_URL`, `ANTHROPIC_API_KEY`).
3. Start Redis: `.\scripts\start-redis-windows.ps1`
4. Install dependencies: `npm install`
5. Start dev servers (API + workers): `npm run dev`

Notes:
- `npm run dev` runs API, worker-alerts, worker-ai concurrently.
- If you prefer not to use Docker, ensure a Redis instance is reachable at `REDIS_URL` and MongoDB at `MONGODB_URI`.

# UJuz Hybrid Pivot Starter

- apps/api: Express + TypeScript API
- apps/worker-alerts: 알림 워커(BullMQ)
- apps/worker-ai: AI 워커(BullMQ)
- packages/db: Prisma 스키마/클라이언트

## Quickstart
1) cp .env.example .env
2) docker compose up -d
3) npm install
4) npm run db:generate && npm run db:migrate && npm run seed
5) npm run dev

API 기본 포트: http://localhost:4000

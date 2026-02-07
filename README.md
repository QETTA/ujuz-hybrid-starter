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

## Docs
- docs/04-MOMCAFE-MONETIZATION.md: 육아맘카페 파트너(B2B2C) 수익화 전략
- docs/05-PARTNER-API.md: 파트너 API/위젯/레퍼럴 명세

## New APIs (Starter)
- Admin (x-admin-key):
  - POST /v1/partners/orgs
  - POST /v1/partners/cafes
  - POST /v1/partners/cafes/:cafeId/referral-links
  - POST /v1/partners/cafes/:cafeId/widgets
  - GET  /v1/partners/payouts/preview?period=YYYY-MM
  - POST /v1/partners/payouts/run

- Partner ingest (x-partner-key):
  - POST /v1/partners/cafes/:cafeId/external-posts:batch

- Public:
  - POST /v1/referrals/track
  - GET  /v1/widgets/:widgetKey

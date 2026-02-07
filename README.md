# UJUz Hybrid Server (Monorepo)

Express + TypeScript + MongoDB 모노레포. 3개 앱 + 3개 공유 패키지.

## 구조

```
ujuz-hybrid-starter/
├── apps/
│   ├── api/              # Express REST API (port 3000)
│   ├── worker-alerts/    # BullMQ 알림 워커
│   └── worker-ai/        # BullMQ AI 워커
├── packages/
│   ├── config/           # env, logger, regions
│   ├── db/               # MongoDB 연결/인덱스
│   └── shared/           # 유틸리티 (errors, distance, crypto)
├── infra/
│   └── digitalocean/     # Terraform (Droplet + Firewall)
├── Dockerfile            # 멀티스테이지 빌드 (APP_NAME으로 앱 선택)
├── docker-compose.yml    # 로컬 개발 (Redis)
└── docker-compose.prod.yml  # 프로덕션 (API + Workers + Redis)
```

## Quickstart

```bash
cp .env.example .env
docker compose up -d        # Redis
npm install
npm run dev                 # API + Workers (concurrently)
```

## 빌드 & 배포

```bash
npm run typecheck           # 전체 워크스페이스 타입 체크
npm run build               # 전체 워크스페이스 빌드 (dist/)
npm run lint                # 전체 워크스페이스 린트

# Docker
docker build -t ujuz-server .
docker run -e APP_NAME=api -p 3000:3000 ujuz-server

# Production (docker compose)
docker compose -f docker-compose.prod.yml up -d
```

## CI/CD

| Workflow | Trigger | 설명 |
|----------|---------|------|
| `pr-check.yml` | PR → main | typecheck + lint |
| `ci.yml` | push → main | typecheck + lint + build |
| `deploy-do.yml` | 수동 dispatch | Docker build → GHCR push → Terraform → SSH deploy |

필요 Secrets: `DO_TOKEN`, `DO_SSH_KEY`, `DO_SSH_FINGERPRINT`, `DROPLET_IP`

## API 엔드포인트

| 경로 | 인증 | 설명 |
|------|------|------|
| `GET /health` | public | 헬스체크 + DB 상태 |
| `/places/*` | deviceAuth | 시설 검색/상세 |
| `/insights` | deviceAuth | 시설 인사이트 |
| `/group-buys/*` | deviceAuth | 공동구매 |
| `/peer/*` | deviceAuth | 또래 커뮤니티 |
| `/api/ujuz/admission` | deviceAuth | 입소 점수 계산 |
| `/api/ujuz/v1/*` | deviceAuth | 입소 V1 API |
| `/api/ujuz/alerts` | deviceAuth | TO 알림 |
| `/api/ujuz/bot` | deviceAuth | 우주봇 AI |
| `/api/ujuz/subscriptions` | deviceAuth | 구독 관리 |
| `/api/ujuz/users` | deviceAuth | 사용자 관리 |
| `/api/ujuz/partners` | adminKey | 파트너 관리 |
| `/api/ujuz/referrals` | public | 레퍼럴 트래킹 |
| `/api/ujuz/widgets` | public | 위젯 |

## 환경변수

`.env.example` 참조. 주요 항목:
- `MONGODB_URI` / `MONGODB_DB_NAME` - MongoDB Atlas
- `REDIS_URL` - BullMQ 큐
- `DEVICE_AUTH_ENABLED` - 디바이스 인증 (default: false)
- `ANTHROPIC_API_KEY` - Claude API (봇)

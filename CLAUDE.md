# UJUz (우쥬) - Claude Code 운영 가이드

> Monorepo | Cross-AI 협업 환경 | Last Updated: 2026-02-08
> **브랜드**: UJUz (우쥬) - "우리 아이 입학 지도"

## 0. 이 문서의 목적

- Claude는 이 레포에서 **설계, 코드 변경, 빌드 검증, 배포 안전성 확인**을 수행한다
- Claude는 **비밀정보(URI/비번/토큰)를 문서/코드/커밋에 절대 포함하지 않는다**
- 배포/DB/GPT Actions 변경 시 **아래 표준 절차를 따른다**
- 민감정보는 **DO env / Doppler / .env (gitignored)** 로만 주입한다

---

## 1. 30초 Quickstart

```bash
# 전체 설치
git clone git@github.com:QETTA/ujuz-hybrid-starter.git
cd ujuz-hybrid-starter
npm i

# 서버 + 워커 동시 실행
npm run dev

# 모바일 앱
npm run dev:mobile

# 전체 타입체크
npm run typecheck:all
```

---

## 2. 모노레포 구조

```
ujuz-hybrid-starter/
├── apps/
│   ├── api/                    # Express 백엔드 (서버)
│   │   └── src/
│   │       ├── config/         # env, logger, mongodb
│   │       ├── middleware/     # cors, deviceAuth, helmet, rateLimit, errorHandler
│   │       ├── routes/         # 라우트 파일
│   │       ├── services/       # 비즈니스 로직
│   │       ├── dto/            # Data Transfer Objects
│   │       └── types/          # TypeScript 타입
│   ├── mobile/                 # React Native / Expo 앱
│   │   ├── app/                # 모바일 소스코드
│   │   │   ├── design-system/  # UI SSOT
│   │   │   ├── constants/      # 색상/레이아웃 토큰
│   │   │   ├── screens/        # 화면
│   │   │   ├── components/     # 컴포넌트
│   │   │   ├── hooks/          # 커스텀 훅
│   │   │   ├── services/       # API 호출
│   │   │   ├── stores/         # Zustand 상태관리
│   │   │   └── types/          # TypeScript 타입
│   │   ├── jest.config.js      # Jest 설정
│   │   ├── jest.setup.js       # Jest mock 설정
│   │   └── .eslintrc.js        # ESLint (RN a11y)
│   ├── worker-ai/              # AI 워커
│   └── worker-alerts/          # 알림 워커
├── packages/
│   ├── config/                 # 공유 설정
│   ├── db/                     # MongoDB 클라이언트
│   └── shared/                 # 공유 유틸리티/타입
├── infra/                      # Terraform (DigitalOcean)
├── docs/                       # 프로젝트 문서
├── .claude/                    # Claude Code 에이전트/스킬/설정
├── .github/                    # CI/CD 워크플로우
└── .serena/                    # Cross-AI 협업 메모리
```

---

## 3. 실행 환경 / 배포 (DigitalOcean)

| 항목 | 값 |
|------|-----|
| 플랫폼 | DigitalOcean Droplet + Docker |
| IaC | `infra/` (Terraform) |
| 컨테이너 레지스트리 | GHCR (`ghcr.io/QETTA/ujuz-api`) |
| API Source | `apps/api/` |
| Build cmd | `npm run build` (tsc) |
| Run cmd | `npm run start` (node dist/index.js) |
| Health check | `GET /health` |
| CI/CD | `.github/workflows/deploy-do.yml` |
| 모바일 빌드 | EAS Build (`apps/mobile/eas.json`) |

### 배포 실패 시 확인 순서

1. Node.js 버전 (package.json engines)
2. 환경변수 누락 (MONGODB_URI, MONGODB_DB_NAME)
3. `npm run build` (tsc 컴파일 에러)
4. Docker 빌드 로그
5. MongoDB Atlas 네트워크 접근 (IP allowlist)

---

## 4. MongoDB Atlas

| 항목 | 설명 |
|------|------|
| 드라이버 | `mongodb@7.x` |
| 연결 | `packages/db/` (공유 싱글턴 + 재시도 로직) |
| Pool size | 10 |
| 재시도 | 지수 백오프 + jitter, 최대 5회 |

### 환경변수 (secret - 값은 절대 문서에 넣지 않음)

| 변수명 | 용도 |
|--------|------|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB_NAME` | 데이터베이스 이름 |

### 주요 컬렉션

places, refinedInsights, peerActivities, dataBlocks, admissionScores, waitlistSnapshots, toSubscriptions, toAlerts, conversations, userSubscriptions, groupBuys, users, children

---

## 5. API 엔드포인트 + 인증 정책

### 라우트 구조 (`apps/api/src/index.ts`)

| 경로 | 인증 | 설명 |
|------|------|------|
| `GET /health` | public | 헬스체크 + DB 상태 |
| `/.well-known`, `/openapi.yaml` | public | GPT Actions 연동 |
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

### 인증 현황

- **방식**: `x-device-id` 헤더 (UUID v4)
- **현재**: `DEVICE_AUTH_ENABLED=false` (개발 편의)
- **운영 전환 시**: 인증 활성화 + GPT Actions 헤더 설정

---

## 6. 환경변수 전체 목록 (값은 주입만, 문서에 절대 노출 금지)

| 변수 | 용도 | 필수 |
|------|------|------|
| `NODE_ENV` | 환경 구분 | default: development |
| `HOST` | 바인딩 주소 | default: 0.0.0.0 |
| `PORT` | 서버 포트 | default: 3000 |
| `LOG_LEVEL` | 로그 레벨 | default: info |
| `MONGODB_URI` | DB 연결 | 운영 필수 |
| `MONGODB_DB_NAME` | DB 이름 | 운영 필수 |
| `CORS_ORIGIN` | 허용 origin (쉼표 구분) | 권장 |
| `DEVICE_AUTH_ENABLED` | 디바이스 인증 | default: false |
| `ANTHROPIC_API_KEY` | Claude API (봇/워커) | AI 사용 시 |
| `TOSS_SECRET_KEY` | 토스 결제 시크릿 | 결제 시 |
| `TOSS_CLIENT_KEY` | 토스 결제 클라이언트 | 결제 시 |
| `EXPO_ACCESS_TOKEN` | Expo 푸시 알림 | 푸시 시 |
| `SENTRY_DSN` | Sentry 에러 트래킹 | 운영 시 |

---

## 7. 개발 도구 조합

### Cross-AI 협업 (Claude + 외부 AI)

| 역할 | Claude | 외부 AI |
|------|--------|---------|
| 설계/아키텍처 | O | - |
| 코딩/리팩토링 | - | O |
| 품질 검수 | O | - |
| Git 관리 | O | - |

워크플로우: `User -> Claude 설계 -> 외부 AI 코딩 -> Claude 검수 -> Claude 커밋`

---

## 8. 금지 / 주의 (최우선)

### 문서/레포에 절대 넣지 말 것

- MongoDB connection string (username/password 포함)
- Atlas IP allowlist / 개인 IP
- API 키, bearer token, device secret
- 결제 카드 정보

### 민감정보 주입 방법

- **로컬**: `.env` (gitignored)
- **CI/CD**: GitHub Secrets
- **운영**: DigitalOcean env / Doppler

### 코드 규칙

- ES modules 사용 (CommonJS 금지) - 서버/패키지
- 함수형 컴포넌트 + React Hooks - 모바일
- 경로 alias: `@/app/*` -> `app/*` (모바일), `@ujuz/*` -> `packages/*` (공유)
- 타입: 각 앱/패키지 내 `types/` 분리
- 하드코딩 색상 금지 -> `Colors.xxx` 토큰 (`.claude/docs/design-system.md`)

---

## 9. 빠른 명령어

```bash
# 모노레포 루트
npm run dev              # API + 워커 동시 실행
npm run dev:mobile       # Expo 개발 서버 (LAN)
npm run dev:all          # API + 워커 + 모바일 동시
npm run typecheck        # 서버/패키지 타입체크
npm run typecheck:mobile # 모바일 타입체크
npm run typecheck:all    # 전체 타입체크
npm run lint             # 전체 린트
npm run build            # 전체 빌드
npm run test             # Vitest (서버)

# 모바일 (apps/mobile/)
cd apps/mobile
npx jest --passWithNoTests  # 모바일 테스트
npx eslint app/ --ext .ts,.tsx --quiet  # 모바일 린트
```

---

## 10. 자연어 명령어

| 말만 하면 | Claude가 자동으로 |
|----------|------------------|
| "에러 고쳐" | 에러 분석 -> 자동 수정 -> 검증 |
| "빌드해" | typecheck + lint 실행 |
| "테스트해" | Jest/Vitest 테스트 실행 |
| "저장해" | add -> commit (메시지 자동) |
| "올려" | push to remote |
| "PR 만들어" | commit -> push -> PR 생성 |

---

## 모듈 참조

@.claude/docs/commands.md
@.claude/docs/design-system.md
@.claude/docs/error-patterns.md
@.claude/docs/cross-ai.md
@.claude/docs/environment.md

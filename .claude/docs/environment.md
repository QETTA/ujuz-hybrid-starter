# 모노레포 환경 가이드

## 워크스페이스 구조

| 패키지 | 경로 | 설명 |
|--------|------|------|
| `apps/api` | Express 백엔드 | API 서버 |
| `apps/mobile` | React Native | 모바일 앱 |
| `apps/worker-ai` | AI 워커 | Claude API 연동 |
| `apps/worker-alerts` | 알림 워커 | 푸시/TO 알림 |
| `packages/config` | 공유 설정 | env, 상수 |
| `packages/db` | DB 클라이언트 | MongoDB 연결 |
| `packages/shared` | 공유 유틸 | 타입, 헬퍼 |

## TypeScript 설정

- `tsconfig.base.json` (루트) - 공통 컴파일 옵션
- 각 앱/패키지에 자체 `tsconfig.json` (extends base)
- `npm run typecheck` - 서버/패키지만
- `npm run typecheck:mobile` - 모바일만
- `npm run typecheck:all` - 전체

## 패키지 의존성

```
apps/api          → packages/db, packages/config, packages/shared
apps/worker-ai    → packages/db, packages/config, packages/shared
apps/worker-alerts → packages/db, packages/config, packages/shared
apps/mobile       → (독립, Expo managed)
```

## Docker

- `Dockerfile` - API 서버 컨테이너
- `docker-compose.yml` - 개발 환경
- `docker-compose.prod.yml` - 프로덕션 환경

## 테스트

- **서버**: Vitest (`vitest.config.ts` 루트)
- **모바일**: Jest (`apps/mobile/jest.config.js`)

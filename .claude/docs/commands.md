# 빌드 및 개발 명령어 (모노레포)

## 루트 명령어

```bash
npm run dev              # API + 워커 동시 실행
npm run dev:mobile       # Expo 개발 서버 (LAN)
npm run dev:emu          # Expo 에뮬레이터 연결
npm run dev:all          # API + 워커 + 모바일 동시
npm run build            # 전체 빌드
npm run typecheck        # 서버/패키지 타입체크
npm run typecheck:mobile # 모바일 타입체크
npm run typecheck:all    # 전체 타입체크
npm run lint             # 전체 린트
npm run test             # Vitest (서버 테스트)
```

## 모바일 (apps/mobile/)

```bash
cd apps/mobile
npx jest --passWithNoTests              # Jest 테스트
npx eslint app/ --ext .ts,.tsx --quiet  # ESLint
npx expo start --lan                    # Expo 개발 서버
```

## 서버 (apps/api/)

```bash
cd apps/api
npm run dev              # 로컬 서버 (tsx watch)
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 실행
```

## ADB 명령어

```bash
# 스크린샷
adb exec-out screencap -p > screen.png

# 에뮬레이터 연결
adb devices -l
```

## Docker

```bash
docker compose up -d       # 개발 환경
docker compose -f docker-compose.prod.yml up -d  # 프로덕션
```

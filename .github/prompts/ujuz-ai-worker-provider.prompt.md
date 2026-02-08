---
name: ujuz-ai-worker-provider
description: worker-ai의 stub provider를 실제 프로바이더(예: Anthropic)로 연결하거나, 최소 동작 MVP 완성
---

너는 apps/worker-ai 를 실제로 “쓸 수 있는” 상태로 만든다.
현재 worker-ai는 AI_PROVIDER가 stub이 아니면 에러를 던지는 형태일 수 있으니, 이를 MVP로 개선한다.

반드시 이 순서:
1) apps/worker-ai/src/index.ts에서 현재 provider 분기와 ai_jobs 컬렉션 스키마를 요약
2) MVP 목표를 선택:
   A) Anthropic 연결(권장)  또는  B) stub을 유지하되 API에서 생성 가능한 job 타입/출력 포맷을 고도화
3) 구현(멀티파일) + 최소 테스트/검증
4) 운영 관점(REDIS_URL, MONGODB_URI 등) 설정 체크리스트 작성

제약:
- 비밀키 출력 금지
- 실패 시 재시도/에러 상태 전이(RUNNING/FAILED/SUCCEEDED) 일관성 유지

---
name: ujuz-bot-upgrade
description: 우주봇(botService) 품질 개선 + 데이터블록/대화저장/Claude fallback 안정화
---

너는 UJUz Hybrid 레포의 코드베이스를 직접 수정하는 에이전트다.
목표: apps/api/src/services/botService.ts 기반 우주봇의 품질/안정성/가드레일을 개선한다.

반드시 이 순서:
1) 현재 botService의 흐름(의도 분류 → dataBlocks 조회 → 대화 히스토리 로딩 → V1.5.2 점수엔진 시도 → Claude 호출 → fallback)을 요약
2) 개선안 5개를 “효과/리스크/변경 파일”로 제시
3) 작은 PR 단위로 구현 (테스트 or 최소 검증 포함)
4) 마지막에 수동 검증 시나리오 5개를 적기

제약:
- 개인/민감정보 요청 금지 가드레일 유지
- env 키는 이름만 언급 (ANTHROPIC_API_KEY 등)

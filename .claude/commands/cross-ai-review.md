---
name: cross-ai-review
description: 외부 AI 피드백 교차 검증
allowed-tools:
  - "Bash(npm run typecheck*)"
  - "Bash(npm run lint*)"
  - "Bash(git *)"
  - "Read(*)"
  - "Grep(*)"
---

# Cross-AI Review 명령어

> `/cross-ai-review` 또는 `/car`로 호출

## 용도

외부 AI 피드백 수신 시 자동 검증 프로토콜 실행

## 실행 내용

### 1. 품질 검증
```bash
npm run typecheck
npm run lint --quiet
```

### 2. 코드 상태 분석
- design-system import 카운트
- 하드코딩 색상 카운트
- Git 변경사항 확인

### 3. 리포트 생성

```markdown
## 🔄 Cross-AI Review

### 품질 게이트
| 검사 | 결과 |
|------|------|
| TypeScript | ✅/❌ |
| ESLint | ✅/❌ |

### 코드 현황
| 지표 | 수치 |
|------|------|
| design-system imports | N개 |
| 하드코딩 색상 | N개 |

### 피드백 분석
- ✅ 동의: [항목]
- ⚠️ 조건부: [항목]
- ❌ 반박: [항목]

### 액션 아이템
1. [작업 1]
2. [작업 2]
```

## 파라미터

`$ARGUMENTS` - 외부 AI 피드백 내용 (선택)

## 예시

```
/cross-ai-review GPT가 Tamagui 적용 확장을 제안했어
```

## 관련 에이전트

`.claude/agents/cross-ai-reviewer.md`

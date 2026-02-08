---
name: cross-ai-review
version: 1.2.0
description: GPT ↔ Claude 교차 검증 프로토콜
user-invocable: true
disable-model-invocation: false
context: fork
model: sonnet
tools:
  - Bash
  - Read
  - Grep
  - Glob
triggers:
  - "교차검수"
  - "GPT 의견"
  - "외부 AI 피드백"
  - "크로스 체크"
  - "다른 AI가"
  - "ChatGPT가"
  - "세컨드 오피니언"
allowedTools:
  - "Bash(npm run typecheck*)"
  - "Bash(npm run lint*)"
  - "Bash(git diff*)"
  - "Bash(git status*)"
  - "Read(*)"
  - "Grep(*)"
  - "Glob(*)"
updated: 2026-02-04
---

# Cross-AI Review Skill

> `/cross-ai-review` 또는 "교차검수", "외부 AI 피드백" 시 자동 실행

## 트리거

다음 표현 감지 시 자동 실행:
- "교차검수", "크로스 체크", "상호 검증"
- "GPT 의견", "외부 AI 피드백", "외부 리뷰"
- "다른 AI가", "ChatGPT가", "세컨드 오피니언"

---

## 자동 실행 프로세스

### Step 1: 품질 게이트 검증

```bash
npm run typecheck
npm run lint --quiet
```

### Step 2: 코드 현황 분석

design-system 사용량 확인:
```bash
grep -r "@/app/design-system" app/ --include="*.tsx" | wc -l
```

하드코딩 색상 검출:
```bash
grep -rE "#[0-9A-Fa-f]{6}" app/ --include="*.tsx" | grep -v "node_modules" | wc -l
```

Git 변경사항 확인:
```bash
git status --short
git diff --stat
```

### Step 3: 피드백 분석 (있는 경우)

| 피드백 유형 | 검증 방법 | 수용 기준 |
|------------|----------|----------|
| 버그 지적 | 코드 실행/테스트 | 재현 가능 시 수용 |
| 패턴 개선 | 기존 코드 분석 | 일관성 향상 시 수용 |
| 성능 이슈 | 프로파일링 | 측정 가능한 개선 시 수용 |
| 스타일 의견 | 프로젝트 컨벤션 확인 | 기존 패턴과 일치 시 수용 |
| 아키텍처 제안 | 영향 범위 분석 | ROI 긍정적 시 검토 |

---

## 출력 형식

```markdown
## Cross-AI Review 완료

### 품질 게이트
| 검사 | 결과 |
|------|------|
| TypeScript | PASS/FAIL (N errors) |
| ESLint | PASS/FAIL |

### 코드 현황
| 지표 | 수치 |
|------|------|
| design-system imports | N개 |
| 하드코딩 색상 | N개 |
| 변경된 파일 | N개 |

### 피드백 분석 (선택)
- ✅ 동의: [항목] - 코드 증거
- ⚠️ 조건부: [항목] - 조건
- ❌ 반박: [항목] - 대안 제시

### 액션 아이템
1. [즉시] 항목
2. [검토] 항목
```

---

## 의사결정 원칙

1. **코드 > 의견** - 실제 코드가 진실
2. **맹목적 동의 금지** - 항상 검증 후 수용
3. **반박 시 대안 제시** - 근거 + 대안 필수
4. **프로젝트 컨벤션 우선** - 외부 의견 < 실제 코드

---

## 품질 게이트 통과 조건

피드백 수용 전 필수 통과:
- [ ] TypeScript 컴파일 성공
- [ ] 기존 동작 유지
- [ ] 프로젝트 컨벤션 준수
- [ ] Breaking change 없음

---

## 관련 문서

- `.serena/memories/cross-ai-review-workflow.md`
- `.serena/memories/cross-ai-shared-context.md`
- `CLAUDE.md`

$ARGUMENTS

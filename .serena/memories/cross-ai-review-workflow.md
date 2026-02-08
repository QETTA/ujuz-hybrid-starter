# Cross-AI 교차 검증 워크플로우

> Claude ↔ GPT Codex 상호 검증 프로세스
> Last Updated: 2026-02-04

---

## 1. 워크플로우 개요

```
┌─────────────────────────────────────────────────────┐
│                  User Request                        │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              Claude 설계/SPEC 작성                   │
│  - 아키텍처 결정                                     │
│  - API 인터페이스 정의                               │
│  - 구현 요구사항 명세                                │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              GPT Codex 코딩 실행                     │
│  - SPEC 기반 구현                                    │
│  - 리팩토링                                          │
│  - 패턴 일괄 적용                                    │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              Claude 검수 (Cross-Review)              │
│  - npm run typecheck                                 │
│  - npm run lint                                      │
│  - 패턴 검증                                         │
│  - 동의/반박 리포트                                  │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              Claude Git 커밋                         │
│  - Conventional Commits                              │
│  - Co-Authored-By 태그                               │
└─────────────────────────────────────────────────────┘
```

---

## 2. 트리거 명령어

### 2.1 사용자 트리거

| 명령 | 실행 |
|------|------|
| "교차검수 해" | Claude cross-ai-reviewer 에이전트 실행 |
| "Codex 피드백 검토해" | GPT 피드백 검증 프로세스 |
| "GPT 의견 확인해" | 외부 AI 의견 검토 |

### 2.2 자동 트리거

- PR 생성 시 자동 검토
- 대량 코드 변경 시 자동 검토
- 핵심 파일 수정 시 자동 검토

---

## 3. 검증 체크리스트

### 3.1 코드 품질

```bash
# 필수 검증
npm run typecheck    # TypeScript 컴파일
npm run lint         # ESLint 검사

# 권장 검증
npm run test         # Jest 테스트
npm run verify:quality # 전체 품질 검사
```

### 3.2 패턴 검증

| 패턴 | 검증 방법 |
|------|----------|
| 색상 토큰 | `grep -r '#[0-9A-Fa-f]{6}' app/` |
| 디자인 시스템 | `grep -r '@/app/design-system' app/` |
| 타입 정의 | `grep -r 'any' app/` |
| 에러 처리 | `grep -r 'catch' app/` |

### 3.3 아키텍처 검증

- [ ] 모듈 의존성 방향 확인
- [ ] 순환 의존성 없음
- [ ] 레이어 분리 준수

---

## 4. 리포트 형식

### 4.1 검수 리포트 템플릿

```markdown
## Cross-AI 검수 리포트

### 검수 대상
- 파일: [파일 목록]
- 커밋: [커밋 해시]

### 검수 결과

#### ✅ 통과 항목
1. [항목 1]
2. [항목 2]

#### ❌ 실패 항목
1. [항목 1]: [이유] → [수정 방법]
2. [항목 2]: [이유] → [수정 방법]

#### ⚠️ 권장 사항
1. [권장 1]
2. [권장 2]

### 최종 판정
- [ ] APPROVE
- [ ] REQUEST_CHANGES
- [ ] COMMENT
```

### 4.2 피드백 응답 형식

**동의:**
```markdown
✅ 동의
- 이유: [근거]
- 적용: [코드 변경]
```

**반박:**
```markdown
❌ 반박
- 근거: [코드 증거]
- 대안: [제안 사항]
```

---

## 5. 에이전트 설정

### 5.1 cross-ai-reviewer 에이전트

**위치:** `.claude/agents/cross-ai-reviewer.md`

**트리거:**
- "GPT 의견"
- "Codex 피드백"
- "교차검수"

**도구:**
- Bash (git, npm)
- Read
- Grep
- Glob

### 5.2 code-reviewer 에이전트

**위치:** `.claude/agents/code-reviewer.md`

**트리거:**
- "코드 리뷰"
- "품질 검사"

**도구:**
- Read
- Grep
- Glob
- Bash

---

## 6. 자동화 스크립트

### 6.1 품질 검증 스크립트

```bash
# scripts/verify-cross-ai.sh
#!/bin/bash
echo "=== Cross-AI 품질 검증 ==="
npm run typecheck && npm run lint --quiet
```

### 6.2 패턴 검증 스크립트

```bash
# scripts/verify-patterns.sh
#!/bin/bash
echo "=== 패턴 검증 ==="
echo "하드코딩 색상:"
grep -rE '#[0-9A-Fa-f]{6}' app/ --include='*.tsx' | wc -l

echo "디자인 시스템 사용:"
grep -r '@/app/design-system' app/ --include='*.tsx' | wc -l
```

---

## 7. 참조 문서

| 문서 | 경로 |
|------|------|
| Claude 가이드 | `CLAUDE.md` |
| Codex 가이드 | `.github/CODEX.md` |
| 통합 가이드 | `.serena/memories/CROSS-AI-INTEGRATED.md` |
| 마스터 플랜 | `docs/UJUZ-MASTER-PLAN-V3.md` |

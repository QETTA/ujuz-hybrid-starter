# Claude Code Opus 4.6 — 서브에이전트 & 병렬 워크플로우 최적 가이드

> Updated: 2026-02-08 | Model: Opus 4.6

## 1. 서브에이전트 타입별 최적 모델 & 용도

### 빌트인 에이전트

| 에이전트 | 최적 모델 | 도구 | 언제 사용 |
|----------|----------|------|----------|
| **Explore** | `haiku` | Read-only (Glob/Grep/Read) | 빠른 코드베이스 탐색, 파일 검색 |
| **Plan** | inherit | Read-only | 구현 계획 수립 (plan mode) |
| **Bash** | `haiku` | Bash only | git/npm/docker 명령 실행 |
| **general-purpose** | inherit | All tools | 복잡한 멀티스텝 작업 |
| **claude-code-guide** | `haiku` | Read/WebFetch/WebSearch | Claude Code 사용법 질문 |

### 프로젝트 특화 에이전트 (model 권장)

| 에이전트 | 최적 모델 | 도구 | 용도 |
|----------|----------|------|------|
| **design-token-guardian** | `sonnet` | Read/Grep/Glob/Edit | 하드코딩 색상/스페이싱/폰트 검출 |
| **a11y-enforcer** | `sonnet` | Read/Grep/Bash/Edit | WCAG 2.2 접근성 검증 |
| **performance-enforcer** | `sonnet` | Read/Bash/Grep | 번들 사이즈/리렌더 감지 |
| **performance-prophet** | `opus` | Read/Grep/Glob/WebFetch | 성능 문제 예측 (런타임 전) |
| **security-specialist** | `opus` | Read/Grep/Bash | OWASP Mobile Top 10 감사 |
| **test-generator** | `sonnet` | Read/Write/Grep/Bash | ROI 기반 테스트 생성 |
| **code-reviewer** | `sonnet` | Read/Grep/Glob/Bash | 자동 코드 리뷰 |
| **grand-architect** | `opus` | Task/Read/Grep/Glob | 대규모 기능 계획 + 에이전트 오케스트레이션 |
| **auto-executor** | `sonnet` | Bash/Read/Write/Glob/Grep | 자동 명령 실행 (배치 수정) |
| **cross-ai-reviewer** | `sonnet` | Bash/Read/Grep/Glob | 외부 AI 피드백 검증 |

### 모델 선택 원칙

```
haiku  → 읽기 전용 작업, 검색, 필터링 (비용 1x)
sonnet → 코드 수정, 테스트 생성, 리뷰 (비용 3x, 80% 작업 커버)
opus   → 아키텍처 결정, 보안 감사, 성능 예측 (비용 10x, 복잡 추론)
```

## 2. 백그라운드 에이전트 패턴

### 기본 규칙

- `run_in_background: true` → 메인 대화와 병렬 실행
- 백그라운드 에이전트는 인터랙티브 권한 프롬프트 불가
- 최대 동시 백그라운드 에이전트: ~7개
- 서브에이전트가 서브에이전트를 생성할 수 없음

### 백그라운드 적합 작업

```
✅ 테스트 실행 (30초+)
✅ 코드베이스 탐색/감사
✅ 번들 분석
✅ 보안 스캔
✅ 테스트 파일 생성
```

### 백그라운드 부적합 작업

```
❌ 인터랙티브 피드백 필요한 코드 리뷰
❌ MCP 서버 도구 의존 작업
❌ 사용자 확인 필요한 파일 수정
❌ 체인 의존 작업 (A 결과 → B 입력)
```

### 결과 확인 방법

```bash
# TaskOutput 도구 사용 (block=false로 진행 상황 확인)
TaskOutput(task_id="agent_id", block=false)

# 완료 대기
TaskOutput(task_id="agent_id", block=true, timeout=120000)

# 출력 파일 직접 읽기
Read(~/.claude/tasks/{agent_id}.output)
```

## 3. 병렬 실행 전략

### 패턴 1: Fan-Out (동시 탐색)

```
메인 → [Explore A (haiku)] + [Explore B (haiku)] + [Explore C (haiku)]
       ↓                      ↓                      ↓
       결과 수집 → 종합 분석 → 실행 계획
```

**사용 시점**: 독립적인 영역 조사 (예: 서비스/라우트/미들웨어 감사)

### 패턴 2: Fan-Out + Background (테스트 생성)

```
메인 (코드 수정 진행)
  + [test-generator A (background, sonnet)]
  + [test-generator B (background, sonnet)]
  + [test-generator C (background, sonnet)]
  → 수정 완료 후 결과 수집 → 검증 → 커밋
```

**사용 시점**: 테스트 생성, 보안 감사 등 시간 소요 작업

### 패턴 3: Chain (순차 의존)

```
[Explore (haiku)] → 결과 분석 → [auto-executor (sonnet)] → 검증 → 커밋
```

**사용 시점**: 탐색 결과에 따라 수정 범위가 결정되는 경우

### 패턴 4: Progressive Deepening (점진적 심화)

```
1단계: Explore (haiku) → 빠른 파일/심볼 검색
2단계: 결과 부족 → general-purpose (sonnet) → 깊은 분석
3단계: 복잡한 결정 → grand-architect (opus) → 계획 수립
```

**사용 시점**: 범위가 불명확한 작업

### 작업 크기 최적화

```
너무 작음 → 에이전트 오버헤드 > 실제 작업 (토큰 낭비)
너무 큼   → 순차 병목, 컨텍스트 초과
최적      → 에이전트당 3-10개 파일, 10-50 도구 호출
```

## 4. 비용 최적화

### 토큰 사용량 (에이전트당 평균)

| 모델 | 토큰 | 비용 비율 | 용도 |
|------|------|----------|------|
| haiku | 10-50K | 1x | 탐색, 검색 |
| sonnet | 50-100K | 3x | 코딩, 테스트 |
| opus | 100-200K | 10x | 아키텍처, 보안 |

### 절약 팁

1. **Explore는 항상 haiku** — 읽기 전용이므로 opus 불필요
2. **auto-executor도 sonnet** — 단순 배치 수정은 sonnet 충분
3. **test-generator는 sonnet** — 패턴 기반 생성, opus 불필요
4. **security-specialist만 opus** — 공격 시뮬레이션에 강한 추론 필요
5. **grand-architect만 opus** — 멀티에이전트 오케스트레이션

## 5. 금지 패턴 (실패 원인)

```
❌ 에이전트 과다 생성 (컨텍스트 오염)
❌ 백그라운드 에이전트 결과 확인 없이 커밋
❌ 에이전트 범위가 너무 넓음 (무한 실행)
❌ 메인 컨텍스트와 서브에이전트가 같은 작업 중복
❌ 백그라운드 → 백그라운드 체인 (불가)
❌ 7개 초과 동시 백그라운드 에이전트
❌ MCP 의존 작업을 백그라운드로 실행
```

## 6. 실전 워크플로우 템플릿

### 대규모 리팩토링

```
1. Explore (haiku, x3 병렬) → 영향 범위 파악
2. Plan → 구현 계획 수립
3. auto-executor (sonnet) → 배치 수정
4. test-generator (sonnet, background x4) → 테스트 생성
5. code-reviewer (sonnet) → 리뷰
6. typecheck + jest → 검증
7. 커밋
```

### 출시 전 감사

```
1. security-specialist (opus, background) → 보안 감사
2. performance-prophet (opus, background) → 성능 예측
3. a11y-enforcer (sonnet, background) → 접근성 검증
4. design-token-guardian (sonnet, background) → 디자인 일관성
5. 결과 수집 → 우선순위 정리 → 수정
```

### 일상 개발

```
코드 수정 → design-token-guardian (sonnet) → test-generator (sonnet) → 커밋
```

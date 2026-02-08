# UJUz Cross-AI 통합 협업 가이드

> Claude Code + GPT Codex 협업 환경 통합 문서
> Last Updated: 2026-02-04
> 리브랜딩: KidsMap → UJUz (우쥬)

---

## 1. 역할 분담

| 역할 | Claude Opus 4.6 | GPT Codex |
|------|-----------------|-----------|
| **설계/아키텍처** | Plan Mode | - |
| **코딩/리팩토링** | - | 주 담당 |
| **품질 검수** | typecheck, ADB | - |
| **Git 관리** | commit, PR | - |
| **교차 검증** | 검증자 | 피검증자 |

---

## 2. 표준 워크플로우

```
[User Request]
      ↓
[Claude 설계/SPEC]
      ↓
[Codex 코딩]
      ↓
[Claude 검수]
      ↓
[Claude 커밋]
```

---

## 3. 교차 검증 프로토콜

### 3.1 트리거 키워드

| 키워드 | 실행 에이전트 | 동작 |
|--------|-------------|------|
| "Codex 피드백" | cross-ai-reviewer | typecheck → 패턴 검색 → 의사결정 |
| "GPT 의견" | cross-ai-reviewer | 외부 피드백 검증 |
| "교차검수" | cross-ai-reviewer | 품질 리포트 생성 |

### 3.2 의사결정 원칙

1. **코드 > 의견**: 항상 실제 코드를 확인
2. **맹목적 동의 금지**: 비판적 검토 필수
3. **반박 시 대안 제시**: 근거 + 대안 필수
4. **프로젝트 컨벤션 우선**: 일관성 유지

### 3.3 응답 형식

**동의 시:**
```markdown
✅ 동의: [이유]
적용 결과: [코드/변경사항]
```

**부분 동의 시:**
```markdown
⚠️ 부분 동의: [조건부 수용 사유]
제안 수정: [대안]
```

**반박 시:**
```markdown
❌ 반박: [근거]
코드 증거: [파일:라인]
대안: [제안 사항]
```

---

## 4. 품질 검증 체크리스트

### 4.1 필수 검증 항목

- [ ] `npm run typecheck` 통과
- [ ] `npm run lint` 통과
- [ ] 디자인 시스템 준수 (Colors.xxx 토큰)
- [ ] 타입 정의 완전성
- [ ] 에러 처리 패턴 준수

### 4.2 권장 검증 항목

- [ ] 테스트 코드 작성
- [ ] 접근성 속성 추가
- [ ] 성능 최적화 (memo, useMemo)
- [ ] 문서 업데이트

---

## 5. 파일 경로 참조

| 용도 | 경로 |
|------|------|
| Claude 가이드 | `CLAUDE.md` |
| Codex 가이드 | `.github/CODEX.md` |
| 마스터 플랜 | `docs/UJUZ-MASTER-PLAN-V3.md` |
| 교차검수 리포트 | `docs/CROSS-REVIEW-V3-REPORT.md` |
| 디자인 시스템 | `.claude/docs/design-system.md` |
| 에러 패턴 | `.claude/docs/error-patterns.md` |

---

## 6. 프로젝트 현황

### 6.1 기술 스택

- React Native 0.81.5 + Expo SDK 54
- TypeScript 5.9
- MongoDB Atlas + Redis + BullMQ
- Claude API (Intent Classification)
- Supabase Auth + Toss Payments

### 6.2 핵심 기능

- 입소 점수 예측 (Admission Score)
- TO 알림 서비스
- 우주봇 AI 상담
- 프리미엄 구독

### 6.3 14주 로드맵

| Phase | 기간 | 내용 |
|-------|------|------|
| 0 | Week 0 | 인증 시스템 구축 |
| 1 | Week 1-4 | 데이터 파이프라인 + 입소 점수 |
| 2 | Week 5-8 | TO 알림 + 우주봇 |
| 3 | Week 9-12 | 결제 + 통합 |
| Buffer | Week 13-14 | QA + 릴리즈 |

---

## 7. 연락처

- Claude Code 세션: 현재 대화
- GPT Codex: GitHub Codex 에이전트
- 이슈 보고: GitHub Issues

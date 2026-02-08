# UX 100-Iteration Roadmap Cycle - 학습 요약

## 1. 전체 구조

| 구간 | Iterations | 대상 | 우선순위 |
|------|-----------|------|---------|
| P0 Critical Screens | 01-22 | 24개 핵심 화면 | P0 (즉시 수정) |
| P1 Components Round 1 | 23-50 | 28개 컴포넌트 | P1-P2 |
| P2 Design System Round 2 | 51-70 | 20개 디자인시스템/공유 컴포넌트 | P2 |
| P3 Advanced + Global Audits | 71-100 | 30개 고급 컴포넌트 + 전체 감사 | P2-P3 |

## 2. 각 Iteration 표준 템플릿

모든 iteration은 동일한 구조를 따름:

1. **Scope**: 대상 파일 경로
2. **Session ID**: `UXR_YYMMDD_itNN_<scope>_<hash>`
3. **Issues to Fix**: P0/P1/P2 분류
4. **UX Modification Checklist** (6축):
   - Copy (A2): 카피/금지어/영문메타
   - Layout (A1): 레이아웃/1스크린 규칙
   - Flow (A1): 네비게이션/CTA
   - Trust (A3): 신뢰도/출처/증거블록
   - A11y (A5): 접근성 라벨/터치타겟
   - Edge Cases (A6): 빈상태/에러/오프라인
5. **Screenshot Capture Plan**: before/after 캡처 명령어
6. **6-Agent Cross-Review**: A1-A6 체크리스트
7. **Success Criteria**: 완료 조건
8. **Commit Message Template**: 표준화된 커밋 메시지

## 3. 6개 에이전트 (교차 검수)

| Agent | 역할 | 주요 체크 |
|-------|------|----------|
| A1 | Flow Guardian | 플로우/1스크린 규칙/CTA 위치 |
| A2 | Copy Auditor | 금지어/TO→빈자리/한글 SSOT/영문메타 금지 |
| A3 | Trust & Evidence | 신뢰도/출처/DataBlock/provenance |
| A4 | Visual Consistency | hex 하드코딩/Colors 토큰/일관성 |
| A5 | Accessibility | 폰트 140%/a11y 라벨/터치타겟 ≥44pt |
| A6 | Edge Cases | 에러상태/빈상태/로딩/오프라인 |

## 4. 5축 태깅 시스템 (SSOT)

1. **Severity (sev)**: P0 | P1 | P2
2. **Category (cat)**: copy | layout | flow | trust | a11y | edge
3. **Rule (rule)**: no_english_meta | no_hex_color | banned_words | to_vacancy | one_screen_result
4. **Area (area)**: trust_row | hero | cta | tabs | filters | cards | input | navigation
5. **Action (do)**: change_copy | change_layout | add_a11y | fix_flow | add_evidence | handle_edge

## 5. Iteration 워크플로우 (7 Phase)

1. **Phase 1 (준비)**: Git hash 확인, iteration 폴더 생성, manifest/tags 초기화
2. **Phase 2 (캡처)**: 에뮬레이터에서 before 스크린샷 캡처
3. **Phase 3 (수정)**: 코드 수정 (이슈 해결)
4. **Phase 4 (재캡처)**: after 스크린샷 캡처, 자동 페어링
5. **Phase 5 (리뷰)**: 6개 에이전트 교차 검수 (A1-A6)
6. **Phase 6 (리포트)**: findings.md + scorecard.csv 생성
7. **Phase 7 (반복)**: P0 미해결 → Phase 3 재진입, 완료 → Next Iteration

## 6. 폴더 구조 (SSOT)

```
docs/ux/reviews/<YYMMDD>/iteration-<NN>-<scope>/
├── manifest.json              # 스크린샷 메타데이터 + 비교쌍
├── local-tags.json            # 태그/코멘트
├── CAPTURE_COMMANDS.md        # 캡처 가이드
├── screenshots/android/       # PNG 파일 (gitignored)
├── exports/serena-export.json # (옵션)
└── reports/
    ├── findings.md            # 이슈 상세 리포트
    └── scorecard.csv          # 집계 CSV
```

## 7. 파일명 규격

`YYMMDD_platform_screen_state_theme_font_rev_agent.png`

예: `260207_android_mypage_default_light_font100_before_A1.png`

## 8. UX 규칙 (금지 사항)

- **no_english_meta**: 영문 메타정보 유저 노출 금지
- **no_hex_color**: 컴포넌트에 hex 하드코딩 금지 → Colors.xxx 토큰 사용
- **banned_words**: 점수/계산/엔진 금지 → 가능성/예측/제거
- **to_vacancy**: "TO" 단독 사용 금지 → "빈자리" 또는 "빈자리(TO)"
- **one_screen_result**: AdmissionResult 히어로가 1스크린에 들어와야 함

## 9. 핵심 스크립트

| 스크립트 | 용도 |
|---------|------|
| `scripts/ux/capture.ps1` | 스크린샷 캡처 + manifest 업데이트 |
| `scripts/ux/capture-batch.ps1` | 배치 캡처 |
| `scripts/ux/manifest.ps1` | manifest 재생성/검증 |
| `scripts/ux/report.ts` | findings.md + scorecard.csv 생성 |
| `scripts/ux/merge-scorecards.ts` | 스코어카드 병합 |
| `scripts/ux/analyze-trends.ts` | 트렌드 분석 |
| `scripts/ux/executive-summary.ts` | 경영진 요약 생성 |

## 10. 커밋 메시지 패턴

```
feat(ux-itNN): <Screen> - <요약>

- Copy: <카피 변경 내용>
- Layout: <레이아웃 변경>
- Trust: <신뢰도 관련>
- A11y: <접근성 관련>
- Edge: <엣지 케이스>

Resolves: UXR-XXXX, UXR-XXXX
UXR session: UXR_YYMMDD_itNN_<scope>_<hash>
Agents: A1-A6
P0 resolved: N

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## 11. 현재 상태 (Iteration 00 완료)

- Baseline 이슈: 5개 (P0: 4, P1: 1)
- UXR-0001~0004: MyPageScreen 영문 라벨 (blocks/confidence/synced/data sources)
- UXR-0005: AdmissionResult 1스크린 규칙 (캡처 대기)
- 다음: Iteration 01 (MyPageScreen 영문 라벨 한글화)

## 12. 최종 목표 (Iteration 100)

- 24개 화면 + 76개 컴포넌트 리뷰
- P0 100% 해결, P1 90%+ 해결
- 600+ 스크린샷, 100+ before/after 비교쌍
- 한글 SSOT 100%, hex 하드코딩 0%, 금지어 0%
- DataBlock/접근성/1스크린 규칙 100% 준수

# uju Mobile-Only IA + Screen Flow (Draft)

> 목적: **모바일만** 기준으로 Splash부터 모든 상세 페이지까지 “Trust → Recommend → Execute” 흐름을 끊기지 않게 설계한다.
> Last Updated: 2026-02-03

---

## 0) Core Loop (1-line)
Discover → Validate(쿠폰/리뷰/안전/대기) → Execute(방문/저장/공유) → Feedback(후기/정정) → Recommend 개선

---

## 1) Top-level IA (Bottom Tabs)

- **uju (Home)**: Trust 구축 + Single Recommendation
- **Map**: Intelligence 시각화 레이어 (peers/deals/saved 컨텍스트 스위치 포함)
- **Deals**: 혜택/쿠폰 모아보기 (Block 기반)
- **Saved**: 찜/컬렉션/플래너
- **Ask**: uju bot (근거 블록 기반 답변)

원칙:
- 탭은 5개 유지 (탭 과밀도는 줄이고, Map 내부에서 context를 스위치)
- **Peers는 탭이 아니라 Map의 레이어/컨텍스트로 통합**

---

## 2) Global UX Rules

- **Primary action 1개/화면** (나머지는 secondary)
- 모든 정보는 **DataBlock**으로 근거(출처/시간/confidence) 노출
- “Map은 행동 시작점이 아니라 Intelligence 시각화”  
  - 행동은 Place Detail에서 “결정 순간”에만 집중

---

## 3) Screen List (Mobile-only)

### 3.1 App Entry
1. **Splash**
   - 상태: cold start / warm start
   - 로딩: 세션/캐시/권한 상태 확인
2. **Onboarding (first-time only)**
   - 아이 정보(연령/아이수)
   - 선호(실내/야외, 예산, 이동거리)
   - 기본 지역 설정 (권한 거부 대비)
3. **Permissions**
   - 위치 권한 (허용/거부)
   - 알림 권한 (선택)

### 3.2 Main Tabs
4. **uju Home**
   - “오늘의 추천 1개” + 근거 블록
   - Primary action: (기본값) 길찾기/방문
5. **Map Home**
   - 레이어/컨텍스트 칩: peers / deals / saved
   - Bottom sheet: peek(상위 카드 3개) → expand(상세)
6. **Deals**
   - 오늘 혜택 요약 + 필터
7. **Saved**
   - 컬렉션/플래너, 재방문 루프 강화
8. **Ask**
   - 질문 → 답변 + 근거 블록(최소 1개)

### 3.3 Detail
9. **Place Sheet (Bottom Sheet)**
   - peek(미리보기) / mid(의사결정) / full(상세)
10. **Place Detail (Full Screen)**
   - 4 섹션: summary / deals / community / report
11. **Report / Correction**
   - 정보 정정/신고
12. **Feedback**
   - 방문 후 후기/정정 → 추천 품질 개선

---

## 4) Map Home Interaction Rules (고정)

- 드래그/줌: sheet는 peek 유지 + “이 영역 다시 검색” CTA
- 핀/점 탭: sheet가 Place Preview(1/3 높이)로 스냅
- 위로 스와이프: Place Detail(2/3~Full) 확장
- chips(peers/deals/saved):
  - peers: 또래 점 + 공동육아 클러스터
  - deals: 쿠폰 있는 장소 하이라이트 + 상단 “오늘 혜택” 요약
  - saved: 찜한 장소만 노출 + 컬렉션 필터

---

## 5) Place Detail (결정의 순간) 섹션 순서

1) 요약 헤더: 장소명/거리/추천연령/혼잡도
2) 오늘의 딜(있으면 최상단): 혜택 1~2줄 + 근거 + 기간
3) 부모 핵심 리뷰 요약: 장점 3 / 단점 2 (+근거 카운트)
4) 안전/시설 체크: 수유실/주차/화장실/위험요소
5) 또래/공동육아 신호: 비슷한 연령 방문/모임 가능성
6) CTA: 저장 / 길찾기 / 공유 / Ask

Primary action 기본값(권장): **길찾기/방문**

---

## 6) DataBlock UX (공통)

필수 필드:
- value, source, updatedAt, confidence
- provenanceUrl? (가능할 때)

표현 규칙:
- confidence badge (verified/likely/unverified)
- “source · time ago”는 카드 하단 고정
- 결측값/저신뢰는 “왜 없는지” 설명 (예: “최근 데이터 없음”)

---

## 7) Open Questions (결정 필요)

- Map의 기본 활성 레이어: heatmap on? peers off? (초기 혼잡도/복잡도 균형)
- uju Home Primary action 확정 (길찾기 vs 저장 vs Ask)


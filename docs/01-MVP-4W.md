# 첫 4주 MVP 화면 흐름 (온보딩 → 피드 → 후기 → 알림설정 → 구독 유도)

## 목표
- **Day 0~7:** “여기 들어오면 동네/또래 정보가 쌓인다”를 체감 (Aha)
- **Day 7~14:** 후기/질문 작성 1회 이상(행동) + 알림 1개 설정(리텐션 고리)
- **Day 14~28:** 레이어3 제한에 부딪히게 만들고(의도적 제한) 자연스럽게 구독 전환

---

## 핵심 UX 흐름 (MVP 최소 화면 9개)
### 0) 스플래시/권한
- 위치 권한(선택), 푸시 권한(유도), 알림은 “TO 알림에 필요”라고 명확히 고지

### 1) 온보딩 (2-step)
**Step A: 동네 선택**
- 시/구/동(또는 지하철역) 선택 → 커뮤니티 자동 가입
- 추천 동네(가까운 3개) + 검색

**Step B: 또래/상황 태그**
- 아이 나이(0~5), 출생년도, 맞벌이/형제/한부모/다자녀 등 (입소 점수/추천/알림 정밀도에 사용)
- “나중에 변경 가능” 표시(이탈 방지)

> 이벤트 로그: `onboarding_completed(neighborhoodId, cohortYear, tagsCount)`

### 2) 홈(피드) – 3 탭
- **동네 탭(기본):** 가장 가까운 동네 글 + 장소 후기 카드
- **또래 탭:** 출생년도/나이대 기반(“24년생 엄마들”)
- **베스트 탭:** 최근 7일 “유용/댓글/북마크” 기반

> MVP 기준은 단순 정렬 + 추천 고정 핀(시딩용)로 시작

### 3) 글 상세
- 댓글/북마크/유용(리액션) 최소 기능
- “이 글에서 TO/모집 키워드 발견” 배지(탐색 동기)

### 4) 후기 작성(장소/시설)
- 최소 입력: 한줄평 + 태그(5개) + 사진(선택)
- 제출 후: “후기 작성 완료 → 동네 피드 상단 노출(24h)” 보상

### 5) 알림 설정(레벨업 화면)
- **무료:** 키워드/카테고리 알림 1~2개 제한
- 알림 설정 직후: “지금부터 중요한 글 놓치지 않아요” + 푸시 권한 요청

### 6) 레이어3 도구 진입 (입소 점수 / TO 알림 / AI봇)
- 홈 상단에 “입소 가능성 체크” CTA
- 시설 상세(또는 후기)에서 “TO 알림 받기” CTA
- 글쓰기/댓글 옆 “우쥬봇에게 물어보기” CTA

### 7) 구독 벽(Soft Paywall)
- 사용량 제한에 도달할 때만 노출(방해 X)
- “지금 바로 결제”보다 **가치 증명 후**: 결과 화면/알림 설정 후/봇 답변 후

### 8) 결제/구독 완료
- 결제 완료 후 즉시: “혜택 적용됨”과 함께 **다음 행동**(알림 추가/점수 추가 계산/봇 무제한)을 제안

---

## 주차별 실행 계획
### Week 1: ‘커뮤니티만으로도 가치’ 만들기
- 시딩 + 피드 UX 튜닝
- 후기 템플릿/태그 세트 확정
- KPI: D1 retention, onboarding completion, feed view depth(스크롤)

### Week 2: ‘알림’을 리텐션 고리로
- 알림 규칙(키워드/카테고리) 1개 설정 유도
- KPI: 알림 설정률, D7 retention, notification open rate

### Week 3: ‘레이어3 도구’를 일상 루틴으로
- 입소 점수 1회 무료 제공(결과 화면에서 가치 강조)
- TO 알림 1개 무료 제공
- AI 봇 일 5회 무료 제공
- KPI: 도구 진입률, 제한 도달률, paywall 노출→결제 전환

### Week 4: 구독 전환 최적화
- paywall 카피/가격/혜택 A/B
- “가족 요금제”는 후기/알림/점수 사용량이 높은 유저에게만 노출
- KPI: trial→paid, paid retention, ARPPU

---

## 최소 이벤트/지표(추천)
- acquisition: `install_source`, `referral_code`
- activation: `onboarding_completed`, `first_feed_view`, `first_post_created`, `first_review_created`
- retention: `alert_rule_created`, `notification_opened`, `bot_query_sent`, `to_alert_subscribed`
- monetization: `paywall_viewed`, `plan_selected`, `subscription_started`, `subscription_renewed`


# 레퍼럴/수익배분 정산(Starter) 로직

## 1) 정산 대상 이벤트
- `ReferralEventType.SUBSCRIBE`: 구독 결제 발생
- `ReferralEventType.DEAL_PURCHASE`: 공구/딜 결제 발생

## 2) 귀속 규칙(권장)
- 설치/가입 시점에 `ReferralAttribution` 생성
- 만료: 기본 30일(REFERRAL_COOKIE_DAYS)
- 결제 이벤트 발생 시:
  - 가장 최근(lastTouch)의 유효한 attribution을 적용
  - 코드가 없으면 “직접 유입”으로 처리

## 3) 금액 계산
- grossSubscription = SUM(amount) of SUBSCRIBE
- grossCommerce = SUM(amount) of DEAL_PURCHASE
- shareSubscription = floor(grossSubscription * cafe.shareRateSubscription)
- shareCommerce = floor(grossCommerce * cafe.shareRateCommerce)

## 4) 정산서(PayoutLedger)
- key: (cafeId, period=YYYY-MM) 유니크
- 상태:
  - PENDING: 자동 집계 완료
  - APPROVED: 내부 승인(운영)
  - PAID: 지급 완료
  - FAILED: 지급 실패

## 5) 운영 체크리스트
- 환불/취소 반영(결제 취소 이벤트를 negative amount로 넣거나 별도 테이블)
- 부정 트래픽/어뷰징 필터(같은 디바이스/같은 결제수단 반복 등)
- 지급 정보(계좌)는 별도 암호화 저장/외부 PG 활용 권장


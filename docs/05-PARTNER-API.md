# Partner API (Starter) – 맘카페 온보딩/위젯/레퍼럴/인입 데이터

> 이 Starter는 Postgres+Prisma 기준입니다. 실제 서버(Mongo)로 옮길 때도 **리소스/필드 구조는 그대로** 가져가면 됩니다.

## 인증
- 관리자 API: `x-admin-key: <ADMIN_API_KEY>`
- 파트너 데이터 인입(카페→UJuz): `x-partner-key: <raw partner api key>`
  - DB에는 hash로 저장(유출 대비)

---

## 1) 파트너/카페 관리(관리자)
### POST /v1/partners/orgs
- body: { name, orgType?, contactName?, contactEmail? }

### POST /v1/partners/cafes
- body: { orgId, platform, platformCafeId?, name, url?, region?, shareRateSubscription?, shareRateCommerce? }

### POST /v1/partners/cafes/:cafeId/referral-links
- body: { channel?, landingPath? }
- response: { code }

### POST /v1/partners/cafes/:cafeId/widgets
- body: { type, config? }
- response: { widgetKey }

---

## 2) 레퍼럴 트래킹(공개/앱)
### POST /v1/referrals/track
- body:
  - code: string
  - type: INSTALL | SIGNUP | SUBSCRIBE | DEAL_PURCHASE
  - userId? (토큰 있으면 서버가 추론)
  - anonymousId? (설치 시 생성한 uuid)
  - amount? (구매/구독 금액)
  - metadata? (utm, campaign 등)

---

## 3) 카페 게시글 인입(파트너)
### POST /v1/partners/cafes/:cafeId/external-posts:batch
- headers: x-partner-key
- body:
  - posts: [{ externalId, title, body, url?, postedAt?, authorHash?, raw? }]

서버는 MVP에서:
- TO 키워드(“TO/자리/추가모집/결원”) 간단 감지
- 감지된 게시글은 `ExternalPost.toMention=true`로 저장
- 후속으로 워커가 `ToDetection`을 만들고(간단 파싱)
- 실제 TO 알림으로 승격 시(정책/운영 승인 후) `to_alerts` 생성(프로덕트 서버 기준)

---

## 4) 위젯(공개)
### GET /v1/widgets/:widgetKey
- response: { type, config, data }
- data는 type에 따라:
  - TO_ALERT: 최신 TO/모집 요약(샘플)
  - DEALS: 공구 추천 리스트(샘플)


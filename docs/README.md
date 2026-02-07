# UJuz Hybrid Pivot Docs

이 폴더는 **하이브리드(커뮤니티 + 도구) 피벗**을 MVP→스케일로 실행하기 위한 실행 문서 묶음입니다.

## 목차
- 01-MVP-4W.md: 첫 4주 MVP 화면 흐름 + 주차별 목표/로그
- 02-SEEDING-OPS.md: 동네/또래 ‘첫 콘텐츠 시딩’ 운영 플랜
- 03-LAYER3-SPECS.md: 레이어3(입소 점수/TO 알림/AI) 기능 명세 + 유료 전환 트리거
- 04-MOMCAFE-MONETIZATION.md: 육아맘카페(외부 커뮤니티)로 엔진을 수익화하는 B2B2C 전략
- 05-PARTNER-API.md: 파트너(맘카페) 온보딩/위젯/레퍼럴/인입 데이터 API 명세(Starter 기준)
- 06-SETTLEMENT.md: 레퍼럴/수익배분 정산 로직(Starter 기준)
- 07-COMPLIANCE.md: 데이터/플랫폼 준수 원칙(파트너 모델 필수)

> TIP: 실제 프로덕트 코드베이스(kidsmap-mobile 서버)로 옮길 때는, Starter의 `Partner*`, `Referral*`, `ExternalPost*` 테이블과 API를 **Mongo 컬렉션/라우트**로 1:1 매핑하면 됩니다.

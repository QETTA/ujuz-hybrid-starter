# UJUz 디자인 철학 — 2026 토스 디자이너 시각

## Core Principle: Dark-First Premium

### 색상 철학
- **배경**: Near-black (#0A0A0A) — 순수 검정보다 부드러움
- **서피스**: #161616 (카드), #1C1C1E (elevated)
- **액센트**: 민트 그린 (#5DDB9E) — 단일 포인트 컬러
- **텍스트**: #F5F5F7 (primary), #8E8E93 (secondary), #636366 (tertiary)
- **보더**: rgba(255,255,255,0.06) — 거의 안보이는 분리선

### 타이포그래피
- 숫자 = 시각적 주인공 (56px, weight 200, tracking -3)
- 제목: 24px, weight 700, tracking -1
- 본문: 13-14px, weight 400-500
- 라벨: 10-11px, weight 600
- 전부 negative letter-spacing (빠듯한 간격)

### 카드 디자인
- borderRadius: 14-20px (큰 라운딩)
- borderWidth: 0.5 또는 없음
- borderColor: rgba(255,255,255,0.06)
- 그림자: 다크모드에서는 거의 안씀
- padding: 18-24px

### 탭바
- 다크 배경 (BlurView dark tint on iOS)
- 5개 이하 탭
- 아이콘 22px, 라벨 10px weight 600
- 활성: 민트, 비활성: rgba(255,255,255,0.4)
- focused: filled 아이콘, unfocused: outline 아이콘

### 인터랙션
- 모든 터치: haptic feedback (light/medium)
- 엔트리 애니메이션: FadeInDown + spring
- 숫자 변경: counting 애니메이션
- 탭 전환: instant (no transition)

### 금지 사항
- ❌ 그라디언트 남용 (서피스에 그라디언트 금지)
- ❌ 2가지 이상 액센트 색상
- ❌ 인라인 HEX/rgba (Colors 토큰 필수)
- ❌ 작은 텍스트 (최소 10px)
- ❌ 꽉 찬 레이아웃 (여백이 고급감)
- ❌ 영문 meta (alt, placeholder 등)
- ❌ 금지어: 점수, 계산, 엔진
- ❌ 6개 이상 탭

### 핵심 공식
```
고급감 = 다크배경 + 넓은여백 + 큰숫자 + 민트액센트 + 미세보더
신뢰감 = 데이터근거표시 + 면책문구 + 업데이트시간 + 출처표시
```

### 레이아웃 패턴 (토스 2026)
1. **히어로**: 풀폭 다크카드, 메인 숫자 중심
2. **액션 그리드**: 3열 카드, 아이콘+숫자+라벨
3. **알림 프리뷰**: 좌측 컬러바 + 제목/본문
4. **피드**: 세로 스택, 카드간 10-12px 갭
5. **구독 배너**: 수평 바, 티어+CTA

### 스크린별 다크모드 우선순위
1. ✅ TabBar + HomeScreen
2. MyPageScreen
3. SavedScreen  
4. GroupBuyScreen
5. MapScreen (지도 컨트롤)
6. Detail 스크린들
7. Flow 스크린들 (Splash, Onboarding)
8. 공유 컴포넌트 (PeerCard, EmptyState 등)

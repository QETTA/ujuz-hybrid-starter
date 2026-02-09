# UJUz Mobile Error Report - 2026-02-09

> GPT 교차검수용 오류 리포트
> Commit: `af97621` | Branch: `master`
> Reporter: Claude Opus 4.6

---

## 1. CRITICAL: Tamagui `md` Font Size Warning (근본 원인 확인됨)

### 증상
```
WARN  No font size found md undefined in size tokens ["$0","$1",...,"$md","$lg","$xl"]
```
- HomeScreen 진입 시 반복 발생 (렌더 사이클마다)
- MongoPeerSync polling 때마다 추가 발생 (5초 간격)

### 근본 원인
- **위치**: `@tamagui/font-size/dist/cjs/getFontSize.native.js:42-54`
- **메커니즘**: Tamagui의 `fontsParsed`가 모든 font size key에 `$` prefix 추가
  - 설정: `{ md: 16 }` → 파싱 후: `{ $md: 16 }`
  - 조회: `sizeTokens.indexOf("md")` → `["$md"]`에서 "md" 못 찾음 → -1 → 경고
- **발생 지점**: `ButtonText = styled(Text, { variants: { size: { md: {...} } } })`
  - `Text`-derived styled component에 `size="md"` 전달 시 Tamagui 내부 font size 해석 로직 트리거
- **영향**: 개발 모드 전용 (`process.env.NODE_ENV === "development"`), 렌더링은 정상

### 시도한 수정
| # | 접근법 | 결과 |
|---|--------|------|
| 1 | `Object.assign(headingFont.size, { md: 16 })` | FAIL - createInterFont이 size 객체 freeze |
| 2 | `createInterFont` → `createFont`로 교체 (string key 포함) | FAIL - fontsParsed에서 $ prefix 추가 |
| 3 | `LogBox.ignoreLogs(['No font size found'])` | PARTIAL - 디바이스 yellow box만 숨김 |
| 4 | `console.warn` monkey-patch (`__DEV__` only) | APPLIED - Metro 터미널 로그 억제 |

### 현재 상태
- **console.warn 패치로 억제 중** ([index.ts:9-13](index.ts#L9-L13))
- 근본 수정은 Tamagui 프레임워크 수정 또는 `size` variant 이름 변경 필요

### GPT 검수 요청
1. `ButtonText`의 `size` variant를 `buttonSize`로 리네이밍하면 경고 완전 해소 가능한지 확인
2. Tamagui v2 RC에서 이 이슈가 known bug인지 확인
3. `console.warn` monkey-patch 대신 더 나은 접근법 존재 여부

---

## 2. MEDIUM: MongoPeerSync Network Error 반복

### 증상
```
WARN  [MongoPeerSync] getLiveStatus failed: [NetworkError: Network connection error]
WARN  [MongoPeerSync] getPeerTrends failed: [NetworkError: Network connection error]
WARN  [MongoPeerSync] getRecentActivities failed: [NetworkError: Network connection error]
```
- 5초 polling 간격마다 3개 API 동시 실패
- 에뮬레이터 환경에서 서버 미실행 상태

### 근본 원인
- PeerSync hook이 서버 연결 불가 시에도 polling 중단하지 않음
- exponential backoff 없이 동일 간격으로 반복 호출

### 영향
- 개발 중 Metro 로그 오염 (실제 경고 식별 어려움)
- 불필요한 네트워크 요청으로 에뮬레이터 배터리/성능 소모

### 권장 수정
```typescript
// usePeerSync.ts에 추가:
// 1. 연속 실패 시 backoff (5s → 10s → 30s → 60s)
// 2. 최대 재시도 횟수 후 polling 중단
// 3. 네트워크 상태 체크 (NetInfo) 후 조건부 polling
```

### GPT 검수 요청
1. usePeerSync hook의 에러 핸들링 패턴 리뷰
2. exponential backoff 구현 제안

---

## 3. LOW: Zeego Native Menu 경고

### 증상
```
WARN  Warning: Must call import '@tamagui/native/setup-zeego' at your app entry point to use native menus
```
- 앱 시작 시 2회 발생

### 근본 원인
- Tamagui native menu 모듈이 zeego 설정을 요구하지만 미설정

### 영향
- 기능적 영향 없음 (native menu 미사용)
- 로그 노이즈

### 권장 수정
- `index.ts`에 `import '@tamagui/native/setup-zeego'` 추가
- 또는 zeego 미사용 시 관련 의존성 제거

---

## 4. LOW: Supabase 미설정 Fallback

### 증상
```
WARN  [Supabase] Missing credentials. Using mock data fallback.
```

### 근본 원인
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` 환경변수 미설정
- 개발 환경에서 mock 데이터 사용 중

### 영향
- 정상 동작 (설계된 fallback)
- 운영 배포 전 반드시 설정 필요

---

## 5. INFO: 이번 커밋에서 해결된 이슈들

| 이슈 | 상태 | 파일 |
|------|------|------|
| NaverMapView가 삭제된 MapboxMapView를 import | FIXED | map/NaverMapView.tsx |
| Mapbox/Kakao 데드코드 18파일 잔존 | FIXED | 11파일 삭제 |
| 다크모드 하드코딩 rgba 11곳 | FIXED | MapScreen, TabNavigator, AskScreen 등 |
| Shimmer/Skeleton 라이트모드 안 보임 | FIXED | Shimmer.tsx, TamaguiSkeleton.tsx |
| headingFont ReferenceError | FIXED | tamagui.config.ts (createFont) |
| accessibilityRole 타입 에러 4건 | FIXED | HomeScreen.peersync.tsx |
| TODAY_PICKS 하드코딩 색상 | FIXED | Colors 토큰으로 교체 |
| Shadow opacity 불일치 (layout vs shadows) | FIXED | layout.ts |

---

## 6. 아키텍처 리스크 (중장기)

### 6.1 Font System 이중 관리
- `tamagui.config.ts`에서 `createFont`로 정의 (headingFont, bodyFont)
- `ButtonText`에서 `styled(Text, { variants: { size: { md: {...} } } })` 별도 정의
- **리스크**: size variant와 font size token 이름 충돌 지속 가능

### 6.2 Design Token 분산
- `constants/Colors.ts` (292줄)
- `design-system/tokens/index.ts` (60줄)
- `tamagui.config.ts` tokens (150줄)
- **리스크**: 동일 색상이 3곳에 다른 이름으로 존재

### 6.3 PeerSync Polling 아키텍처
- 현재: 단순 setInterval (5초)
- 서버 미연결 시 무한 에러 로그
- **리스크**: 운영 환경에서 서버 장애 시 클라이언트 과부하

---

## 검수 체크리스트 (GPT용)

- [ ] `npx tsc --noEmit` 0 에러 확인
- [ ] Tamagui `md` 경고가 console.warn 패치로 억제되는지 확인
- [ ] 삭제된 Mapbox/Kakao 파일 참조가 0건인지 `grep` 확인
- [ ] 다크모드 전환 시 하드코딩 rgba 잔존 여부 확인
- [ ] NaverMapView 정상 로드 (폴백 포함) 확인
- [ ] HomeScreen 모든 섹션 렌더링 확인
- [ ] accessibilityRole 없이도 TalkBack 정상 동작 확인

---

*Generated: 2026-02-09 | Claude Opus 4.6 | Commit af97621*

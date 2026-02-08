# UJUz 디자인 에이전트 조합 — Opus 4.6 공식 설정

> Updated: 2026-02-08 | Model: Opus 4.6
> 프로젝트: kidsmap-mobile (React Native + Expo + Tamagui)

## 1. 디자인 토큰 SSOT 구조

### 토큰 소스 파일

| 파일 | 역할 | Import |
|------|------|--------|
| `app/constants/Colors.ts` | 앱 전역 색상 (iOS HIG + alpha) | `import { Colors } from '@/app/constants'` |
| `app/constants/Layout.ts` | 화면 크기 + Shadow 상수 | `import { Layout, Shadow } from '@/app/constants'` |
| `app/design-system/tokens/colors.ts` | Tamagui 테마 색상 | `import { Colors } from '@/app/design-system/tokens'` |
| `app/design-system/tokens/spacing.ts` | Spacing: xs(4) sm(8) md(16) lg(24) xl(32) xxl(48) xxxl(64) | `import { Spacing } from '@/app/design-system/tokens'` |
| `app/design-system/tokens/typography.ts` | 폰트 크기/weight/lineHeight | `import { Typography } from '@/app/design-system/tokens'` |
| `app/design-system/tokens/shadows.ts` | 그림자 프리셋 | `import { Shadows } from '@/app/design-system/tokens'` |
| `app/design-system/tokens/animations.ts` | 애니메이션 프리셋 | |
| `app/design-system/tokens/materials.ts` | 머티리얼 프리셋 | |

### 디자인 시스템 컴포넌트 (20+)

`app/design-system/components/` — Button, Card, Badge, Rating, Avatar, Chip, Divider, EmptyState, ErrorView, FloatingCard, GlassCard, ListSkeleton, Loading, LoadingSpinner, PlaceCardSkeleton, PressableScale, RatingStars, Skeleton, Text

**Import**: `import { Button, Card, Badge } from '@/app/design-system'`

---

## 2. 에이전트별 역할 & 설정

### design-token-guardian (디자인 토큰 수호자)

| 항목 | 값 |
|------|-----|
| **모델** | `sonnet` |
| **도구** | Read, Grep, Glob, Edit |
| **사용 시점** | 코드 수정 후, PR 전, Phase 완료 시 |
| **스캔 대상** | `app/components/**/*.tsx`, `app/screens/**/*.tsx` |

**검출 패턴 (Grep)**:

```
# 하드코딩 HEX
pattern: "#[0-9a-fA-F]{3,8}"
glob: "*.tsx"
제외: Colors.ts, colors.ts, tamagui.config.ts, *.test.*

# 하드코딩 rgba
pattern: "rgba?\(\s*\d"
glob: "*.tsx"
제외: Colors.ts, withAlpha 함수 내부

# 하드코딩 fontSize
pattern: "fontSize:\s*\d"
glob: "*.tsx"
제외: Typography.ts, typography.ts

# 하드코딩 padding/margin (매직 넘버)
pattern: "(padding|margin)(Top|Bottom|Left|Right|Horizontal|Vertical)?:\s*\d{2,}"
glob: "*.tsx"
제외: spacing.ts, Layout.ts

# 하드코딩 borderRadius
pattern: "borderRadius:\s*\d{2,}"
glob: "*.tsx"

# inline style 객체
pattern: "style=\{\{"
glob: "*.tsx"
(경고만, 금지 아님)
```

**수정 규칙**:
- `#FF3B30` → `Colors.iosSystemRed`
- `rgba(0,0,0,0.5)` → `Colors.overlayMedium` 또는 `Colors.blackAlpha50`
- `fontSize: 16` → `Typography.body.fontSize` 또는 디자인 시스템 Text 컴포넌트
- `padding: 16` → `Spacing.md`
- Tamagui styled component에서 string 색상 → `as any` 캐스트 필요 (알려진 패턴)

---

### a11y-enforcer (접근성 강제자)

| 항목 | 값 |
|------|-----|
| **모델** | `sonnet` |
| **도구** | Read, Grep, Bash, Edit |
| **사용 시점** | 새 화면/컴포넌트 추가 시, 출시 전 |
| **스캔 대상** | `app/components/**/*.tsx`, `app/screens/**/*.tsx` |

**검출 패턴**:

```
# 터치 타겟 크기 (최소 44x44)
pattern: "(width|height):\s*([1-3]\d|[1-9])\b"
context: TouchableOpacity, Pressable, Button 근처

# accessibilityLabel 누락
pattern: "<(TouchableOpacity|Pressable|Image|Button)[^>]*(?!accessibilityLabel)"
glob: "*.tsx"

# accessibilityRole 누락 (버튼류)
pattern: "<(TouchableOpacity|Pressable)[^>]*(?!accessibilityRole)"
glob: "*.tsx"

# 색상 대비 위험 (밝은 배경 + 밝은 텍스트)
# 수동 검사 필요 — 에이전트가 Colors.ts에서 hex값 추출 후 WCAG 계산
```

**React Native 필수 Props**:
- `accessibilityLabel` — 모든 인터랙티브 요소
- `accessibilityRole` — button, link, image, header, tab
- `accessibilityHint` — 복잡한 동작 설명
- `accessibilityState` — disabled, selected, checked
- 터치 타겟: 최소 `44x44` (Apple HIG) / `48x48` (Material)

---

### performance-prophet (성능 예언자)

| 항목 | 값 |
|------|-----|
| **모델** | `opus` |
| **도구** | Read, Grep, Glob, WebFetch |
| **사용 시점** | 대규모 리팩토링 전, 새 라이브러리 도입 시 |
| **스캔 대상** | 전체 앱 |

**예측 패턴**:

```
# FlatList 내 인라인 함수 (리렌더 유발)
pattern: "renderItem=\{?\(\s*\{" (인라인 정의)
권장: useCallback + 외부 컴포넌트

# 무거운 이미지 (번들 내)
Glob: "**/*.{png,jpg,jpeg}" (require() 사용 시 번들 포함)
권장: CDN URL + expo-image

# 과도한 useEffect
pattern: "useEffect\(" 카운트 — 컴포넌트당 3개 초과 시 경고

# JS 스레드 블로킹
pattern: "JSON\.parse|JSON\.stringify" (큰 데이터)
pattern: "\.sort\(|\.filter\(" (대량 배열)

# Bridge 병목
pattern: "NativeModules\." — 직접 호출 빈도 체크
```

---

### performance-enforcer (성능 감시자)

| 항목 | 값 |
|------|-----|
| **모델** | `sonnet` |
| **도구** | Read, Bash, Grep |
| **사용 시점** | 빌드 후, PR 전 |

**검사 항목**:

```bash
# 번들 사이즈 (expo export)
npx expo export --platform ios --dump-sourcemap

# 무거운 import
pattern: "import .* from '(moment|lodash(?!/))'"
권장: date-fns, lodash/specific

# 불필요한 리렌더
pattern: "React\.memo|useMemo|useCallback" — 있어야 할 곳에 없으면 경고

# 이미지 최적화
expo-image 사용 여부, placeholder 설정 여부
```

---

### security-specialist (보안 전문가)

| 항목 | 값 |
|------|-----|
| **모델** | `opus` |
| **도구** | Read, Grep, Bash |
| **사용 시점** | 출시 전 전체 감사, 인증 변경 시 |

**모바일 특화 패턴**:

```
# 하드코딩 시크릿
pattern: "(api_key|secret|password|token)\s*[:=]\s*['\"]"
제외: *.test.*, *.example

# AsyncStorage 민감정보
pattern: "AsyncStorage\.(setItem|getItem).*(?i)(token|password|key)"
권장: expo-secure-store

# HTTP (비TLS) 호출
pattern: "http://" (https가 아닌)
제외: localhost, 127.0.0.1

# eval / innerHTML
pattern: "eval\(|innerHTML|dangerouslySetInnerHTML"

# 서버: SQL/NoSQL 인젝션
pattern: "\$where|\$regex.*\$options" (MongoDB)
pattern: "req\.(body|query|params)\." (직접 사용, 검증 없이)
```

---

### test-generator (테스트 생성기)

| 항목 | 값 |
|------|-----|
| **모델** | `sonnet` |
| **도구** | Read, Write, Grep, Bash |
| **사용 시점** | 기능 구현 후, background 병렬 |

**프로젝트 테스트 구조**:

```
server/src/**/__tests__/*.test.ts  — Jest (서버)
app/**/__tests__/*.test.tsx        — Jest + Testing Library (모바일)
```

**ROI 우선순위**:
1. 비즈니스 로직 (서비스 레이어) — 최고 ROI
2. 유틸리티 함수 — 높은 ROI, 빠른 작성
3. 미들웨어 — 보안 영향 높음
4. 라우트 통합 — 중간 ROI
5. UI 컴포넌트 — 낮은 ROI (스냅샷만)

---

### code-reviewer (코드 리뷰어)

| 항목 | 값 |
|------|-----|
| **모델** | `sonnet` |
| **도구** | Read, Grep, Glob, Bash |
| **사용 시점** | PR 전, Phase 완료 시 |

**리뷰 체크리스트**:
- [ ] 타입 안전성 (any 사용 최소화)
- [ ] 에러 핸들링 (try-catch + next(err))
- [ ] 입력 검증 (Zod schema)
- [ ] 디자인 토큰 준수
- [ ] 접근성 props
- [ ] 성능 안티패턴

---

### grand-architect (대건축가)

| 항목 | 값 |
|------|-----|
| **모델** | `opus` |
| **도구** | Task, Read, Grep, Glob |
| **사용 시점** | 새 기능 계획, 대규모 리팩토링 |

**역할**: 다른 에이전트들을 오케스트레이션. 직접 코드 수정 안 함.

---

## 3. 워크플로우 템플릿

### 일상 개발 (코드 수정 후)

```
수정 완료
  → design-token-guardian (sonnet) — 토큰 위반 검출
  → typecheck + lint 확인
  → 커밋
```

### 새 화면/컴포넌트 추가

```
구현 완료
  → [design-token-guardian (sonnet)] + [a11y-enforcer (sonnet)]  ← 병렬
  → 위반 사항 수정
  → [test-generator (sonnet, background)]
  → 커밋
```

### PR / Phase 완료 감사

```
[design-token-guardian (sonnet, bg)]
+ [a11y-enforcer (sonnet, bg)]
+ [performance-enforcer (sonnet, bg)]
+ [code-reviewer (sonnet, bg)]
→ 결과 수집 → 우선순위 정리 → 수정 → 커밋
```

### 출시 전 전체 감사 (Full Audit)

```
[security-specialist (opus, bg)]
+ [performance-prophet (opus, bg)]
+ [a11y-enforcer (sonnet, bg)]
+ [design-token-guardian (sonnet, bg)]
+ [test-generator (sonnet, bg) × 3-4]
→ 결과 수집 → CRITICAL 먼저 → HIGH → 수정 → 최종 typecheck + jest
```

### 대규모 리팩토링

```
grand-architect (opus) → 계획 수립
→ Explore (haiku × 3, bg) → 영향 범위 파악
→ auto-executor (sonnet) → 배치 수정
→ [design-token-guardian + a11y-enforcer + test-generator] ← 병렬 검증
→ code-reviewer (sonnet) → 최종 리뷰
→ 커밋
```

---

## 4. 프로젝트 특화 Grep 패턴 모음

### 색상 위반 (design-token-guardian 핵심)

```
# HEX 하드코딩 (컴포넌트 파일에서)
grep "#[0-9a-fA-F]{3,8}" --glob "app/components/**/*.tsx" --glob "app/screens/**/*.tsx"
제외: Colors.ts, colors.ts, tamagui.config.ts

# rgba 하드코딩
grep "rgba?\(\s*\d" --glob "app/{components,screens}/**/*.tsx"

# iOS 시스템 색상 직접 사용 (토큰 대신)
grep "'#(FF3B30|FF9500|FFCC00|34C759|007AFF|5856D6|AF52DE|FF2D55)'" --glob "*.tsx"
```

### 스페이싱 위반

```
# 매직 넘버 padding/margin (16 이상)
grep "(padding|margin)\w*:\s*[1-9]\d+" --glob "app/{components,screens}/**/*.tsx"

# gap 하드코딩
grep "gap:\s*\d+" --glob "app/{components,screens}/**/*.tsx"
```

### 타이포그래피 위반

```
# fontSize 하드코딩
grep "fontSize:\s*\d" --glob "app/{components,screens}/**/*.tsx"
제외: typography.ts, Typography.ts

# fontWeight 하드코딩
grep "fontWeight:\s*['\"]?\d" --glob "app/{components,screens}/**/*.tsx"
```

---

## 5. Tamagui 특이사항

### styled 컴포넌트 색상 캐스트

```tsx
// ❌ 타입 에러 (Tamagui GetThemeValueForKey)
backgroundColor: Colors.successAlpha10

// ✅ as any 캐스트 (known pattern)
backgroundColor: Colors.successAlpha10 as any
```

### 디자인 시스템 컴포넌트 우선

```tsx
// ❌ 직접 스타일링
<View style={{ padding: 16, borderRadius: 12, backgroundColor: '#fff' }}>

// ✅ 디자인 시스템 사용
<Card padding="md" borderRadius={12}>
```

---

## 6. 에이전트 비용 최적화

| 워크플로우 | 에이전트 수 | 모델 | 예상 비용 |
|-----------|-----------|------|----------|
| 일상 개발 | 1 | sonnet | 1x |
| 새 화면 | 2-3 | sonnet | 3x |
| PR 감사 | 4 | sonnet | 4x |
| 출시 전 | 7-8 | opus×2 + sonnet×5 | 25x |
| 리팩토링 | 5-6 | opus×1 + sonnet×4 | 15x |

**원칙**: 일상은 sonnet 1-2개, 출시 전만 opus + 대규모 병렬

---
name: ui-check
version: 2.0.0
description: ADB 기반 UI 자동 검증 + 학습 피드백 사이클
user-invocable: true
disable-model-invocation: false
context: fork
model: sonnet
tools:
  - Bash
  - Read
  - Write
  - Grep
triggers:
  - "화면 확인"
  - "UI 봐줘"
  - "스크린샷"
  - "앱 상태"
  - "화면 캡처"
  - "UI 검수"
  - "디자인 검증"
allowedTools:
  - "Bash(adb *)"
  - "Bash(emulator *)"
  - "Bash(*ui-pipeline.sh *)"
  - "Bash(sleep *)"
  - "Bash(timeout *)"
  - "Read(*.png)"
  - "Read(./app/**)"
  - "Read(.claude/docs/*)"
  - "Write(.claude/ui-logs/*)"
  - "Write(.claude/docs/ui-errors-learned.md)"
  - "Grep(*)"
updated: 2026-02-04
---

# UI 자동 검증 + 학습 피드백 스킬

> `/verify-ui` 또는 "화면 확인", "UI 봐줘" 시 자동 실행
> 발견된 오류는 자동으로 학습 데이터베이스에 기록됨

---

## 핵심 파이프라인 스크립트

```bash
# 전체 화면 캡처
./scripts/ui-pipeline.sh capture-all

# 단일 스크린샷
./scripts/ui-pipeline.sh capture [name]

# 오류 로깅
./scripts/ui-pipeline.sh log-error [type] [screen] [description]

# 학습 리포트 생성
./scripts/ui-pipeline.sh learn
```

---

## 자동 실행 프로세스 (v2.0)

### Phase 1: 환경 확인

```bash
# Windows: adb가 PATH에 있음
adb devices -l
```

### Phase 2: 스크린샷 캡처

```bash
./scripts/ui-pipeline.sh capture-all
# 또는
adb -s emulator-5554 exec-out screencap -p > screen-check.png
```

### Phase 3: Vision 분석 + 학습 참조

1. Read tool로 `screen-check.png` 분석
2. `.claude/docs/ui-errors-learned.md` 참조하여 알려진 패턴 확인
3. 새 오류 발견 시 학습 DB에 추가

### Phase 4: 오류 기록 (발견 시)

```bash
./scripts/ui-pipeline.sh log-error [error-code] [screen] "description"
```

오류 코드:
- L01~L05: 레이아웃 (overflow, misalignment, spacing, overlap, cut-off)
- T01~T05: 타이포그래피 (truncation, size, weight, contrast, line-height)
- C01~C04: 색상 (hardcoded, contrast, inconsistent, accessibility)
- P01~P05: 컴포넌트 (missing, broken, loading, empty-state, touch-target)
- N01~N04: 네비게이션 (tab-inactive, back-behavior, gesture, deep-link)

---

## 학습 피드백 사이클

```
┌─────────────────────────────────────────────────────────┐
│  1. 스크린샷 캡처                                        │
│     └─> ./scripts/ui-pipeline.sh capture-all           │
├─────────────────────────────────────────────────────────┤
│  2. Claude Vision 분석                                  │
│     └─> Read(screen-*.png)                             │
│     └─> 학습 DB 참조: .claude/docs/ui-errors-learned.md │
├─────────────────────────────────────────────────────────┤
│  3. 오류 발견 시 로깅                                    │
│     └─> ./scripts/ui-pipeline.sh log-error ...         │
│     └─> .claude/ui-logs/errors-YYYYMMDD.log            │
├─────────────────────────────────────────────────────────┤
│  4. 코드 수정                                           │
│     └─> 해당 컴포넌트 파일 Edit                         │
├─────────────────────────────────────────────────────────┤
│  5. 재검증                                              │
│     └─> 스크린샷 다시 캡처 → 수정 확인                   │
├─────────────────────────────────────────────────────────┤
│  6. 학습 DB 업데이트                                    │
│     └─> 새 패턴 발견 시 ui-errors-learned.md 추가       │
└─────────────────────────────────────────────────────────┘
```

---

## 탭 네비게이션 좌표 (1080x2400)

| 탭 | X | Y | 명령어 |
|----|---|---|--------|
| Home | 135 | 2300 | `input tap 135 2300` |
| Search | 405 | 2300 | `input tap 405 2300` |
| Nearby | 675 | 2300 | `input tap 675 2300` |
| Settings | 945 | 2300 | `input tap 945 2300` |

---

## 화면별 필수 체크리스트

### HomeScreen
- [ ] 지도 타일 로드
- [ ] 마커 최소 1개 표시
- [ ] 하단 탭 바 표시
- [ ] 현재 위치 버튼

### SearchScreen
- [ ] 검색창
- [ ] 카테고리 필터
- [ ] 결과 카드 또는 빈 상태

### PlaceDetailScreen
- [ ] 장소 이미지/플레이스홀더
- [ ] 장소명, 주소
- [ ] 리뷰 섹션/빈 상태
- [ ] 액션 버튼

### SettingsScreen
- [ ] 설정 항목 리스트
- [ ] 버전 정보
- [ ] 로그아웃 버튼

---

## 에러 상태 감지 키워드

| 감지 키워드 | 원인 | 조치 |
|------------|------|------|
| 빨간 배경 + 스택트레이스 | RN Fatal Error | Metro 로그 확인 |
| "Something went wrong" | Expo Go 연결 실패 | URL/포트 확인 |
| "Network Error" | API 연결 실패 | 백엔드 상태 확인 |
| 흰 화면 (아무것도 없음) | 렌더링 실패 | 컴포넌트 에러 확인 |
| 무한 로딩 스피너 | API 타임아웃 | 네트워크 확인 |
| 네이티브 코드 에러 | 네이티브 모듈 누락 | Development Build 필요 |

---

## 보고서 템플릿

```markdown
## UI 검증 결과 - [날짜]

### 세션 정보
- 세션 ID: [session-YYYYMMDD-HHMMSS]
- 디바이스: emulator-5554
- 해상도: 1080x2400

### 화면별 분석

#### 1. HomeScreen
- 상태: ✅ 정상 / ⚠️ 경고 / ❌ 에러
- 스크린샷: `.claude/ui-captures/[session]/01-home.png`
- 체크리스트:
  - [x] 지도 렌더링
  - [x] 마커 표시
  - [x] 탭 바
- 발견된 문제: 없음

#### 2. SearchScreen
- 상태: ...

### 오류 요약
| 코드 | 화면 | 설명 | 심각도 |
|------|------|------|--------|
| T01 | Search | 긴 장소명 잘림 | Medium |

### 권장 수정
1. PlaceCard.tsx - numberOfLines 추가

### 학습 업데이트
- [x] ui-errors-learned.md에 새 패턴 추가
```

---

## 디자인 시스템 자동 검증

### 색상 토큰 체크
```bash
# 하드코딩 색상 검색
rg -n "#[0-9A-Fa-f]{6}" app --glob "*.tsx" | head -20
```

허용된 토큰:
- `Colors.iosLabel` (#1C1C1E)
- `Colors.iosSecondaryLabel` (#3C3C43)
- `Colors.iosSecondaryBackground` (#F2F2F7)
- `Colors.iosSystemBlue` (#007AFF)

### Typography 체크
```bash
# fontSize 하드코딩 검색
rg -n "fontSize:\s*\d+" app --glob "*.tsx"
```

---

## 파일 위치

| 용도 | 경로 |
|------|------|
| 스크린샷 | `.claude/ui-captures/` |
| 오류 로그 | `.claude/ui-logs/` |
| 학습 DB | `.claude/docs/ui-errors-learned.md` |
| 파이프라인 스크립트 | `scripts/ui-pipeline.sh` |

$ARGUMENTS

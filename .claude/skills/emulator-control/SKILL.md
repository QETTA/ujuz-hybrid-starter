---
name: emulator-control
version: 1.1.0
description: Android 에뮬레이터 완전 자동 제어
user-invocable: true
disable-model-invocation: false
context: fork
model: sonnet
tools:
  - Bash
  - Read
triggers:
  - "에뮬레이터"
  - "앱 실행"
  - "앱 켜"
  - "폰 화면"
  - "디바이스"
  - "시뮬레이터"
allowedTools:
  - "Bash(adb *)"
  - "Bash(emulator *)"
  - "Bash(sleep *)"
  - "Bash(timeout *)"
  - "Read(*.png)"
updated: 2026-02-06
---

# 에뮬레이터 완전 자동 제어 스킬

Android 에뮬레이터를 Claude가 완전히 제어합니다.

## 환경 설정

```bash
# Windows: adb, emulator가 PATH에 있음 (직접 사용)
# AVD 이름
AVD_NAME="Medium_Phone_API_36.1"
# 프로젝트 디렉토리 (Windows 경로)
PROJECT_DIR="C:/Users/sihu2/kidsmap-mobile"
```

---

## 트리거 표현

| 사용자 말 | 자동 실행 |
|----------|----------|
| "에뮬레이터 켜" | 에뮬레이터 시작 |
| "앱 실행해" | Expo Go 앱 실행 |
| "화면 봐줘" | 스크린샷 + 분석 |
| "화면 터치" | 좌표 터치 |
| "스크롤 해줘" | 스와이프 실행 |
| "앱 종료해" | 앱 강제 종료 |
| "에뮬레이터 끄기" | 에뮬레이터 종료 |

---

## 1단계: 디바이스 관리

### 연결 확인
```bash
adb devices -l
```

### 에뮬레이터 시작 (백그라운드)
```bash
emulator -avd Medium_Phone_API_36.1 -no-snapshot-load &
timeout /t 30
adb wait-for-device
```

### 에뮬레이터 종료
```bash
adb emu kill
```

### 디바이스 정보
```bash
adb shell getprop ro.product.model
adb shell getprop ro.build.version.sdk
adb shell wm size  # 해상도
adb shell wm density  # DPI
```

---

## 2단계: 앱 제어

### Expo Go 실행
```bash
# Expo 개발 서버 URL로 앱 실행
adb shell am start -a android.intent.action.VIEW \
  -d "exp://10.0.2.2:8081"

# 또는 LAN IP로
adb shell am start -a android.intent.action.VIEW \
  -d "exp://192.168.219.106:8081"
```

### 앱 설치/제거
```bash
# APK 설치
adb install -r app.apk

# 앱 제거
adb uninstall host.exp.exponent
```

### 앱 강제 종료
```bash
adb shell am force-stop host.exp.exponent
```

### 앱 데이터 초기화
```bash
adb shell pm clear host.exp.exponent
```

---

## 3단계: 화면 캡처 & 분석

### 스크린샷 캡처
```bash
# 기본 캡처 (현재 디렉토리)
adb exec-out screencap -p > screen-check.png

# 타임스탬프 포함
adb exec-out screencap -p > screen-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%.png
```

### 연속 캡처 (자동화)
```bash
# 연속 캡처
adb exec-out screencap -p > screen-1.png
timeout /t 2
adb exec-out screencap -p > screen-2.png
timeout /t 2
adb exec-out screencap -p > screen-3.png
```

### Claude Vision 분석
Read tool로 이미지 파일 읽어서 분석:
- 현재 화면 식별
- UI 요소 위치 파악
- 에러 상태 감지
- 색상/레이아웃 검증

---

## 4단계: 터치 & 제스처

### 좌표 터치
```bash
# 단일 터치
adb shell input tap X Y

# 예: 중앙 터치 (1080x2400 기준)
adb shell input tap 540 1200
```

### 롱 프레스
```bash
adb shell input swipe X Y X Y 1000  # 1초 유지
```

### 스와이프
```bash
# 아래로 스크롤 (위→아래)
adb shell input swipe 540 1500 540 500 300

# 위로 스크롤 (아래→위)
adb shell input swipe 540 500 540 1500 300

# 좌→우 스와이프
adb shell input swipe 100 1200 980 1200 300

# 우→좌 스와이프
adb shell input swipe 980 1200 100 1200 300
```

### 핀치 줌 (multi-touch)
```bash
# 줌 인 (SDK 30+)
adb shell input kevent ZOOM_IN

# 줌 아웃
adb shell input kevent ZOOM_OUT
```

---

## 5단계: 키 이벤트

### 네비게이션
```bash
adb shell input keyevent 4    # 뒤로가기
adb shell input keyevent 3    # 홈
adb shell input keyevent 187  # 최근 앱
```

### 텍스트 입력
```bash
# 영문/숫자
adb shell input text "hello123"

# 한글 (클립보드 사용)
adb shell am broadcast -a clipper.set -e text "안녕하세요"
adb shell input keyevent 279  # 붙여넣기
```

### 미디어 키
```bash
adb shell input keyevent 24   # 볼륨 업
adb shell input keyevent 25   # 볼륨 다운
adb shell input keyevent 164  # 음소거
```

### 특수 키
```bash
adb shell input keyevent 26   # 전원
adb shell input keyevent 82   # 메뉴
adb shell input keyevent 66   # 엔터
adb shell input keyevent 67   # 백스페이스
```

---

## 6단계: 화면별 좌표 가이드

### KidsMap 앱 (1080x2400 기준)

#### 하단 탭 네비게이션 (Y ≈ 2300)
| 탭 | X 좌표 | 터치 명령 |
|----|--------|----------|
| Home | 108 | `input tap 108 2300` |
| Search | 324 | `input tap 324 2300` |
| Nearby | 540 | `input tap 540 2300` |
| Saved | 756 | `input tap 756 2300` |
| Profile | 972 | `input tap 972 2300` |

#### 검색창 터치 (상단)
```bash
adb shell input tap 540 150
```

#### 지도 중앙 터치
```bash
adb shell input tap 540 1000
```

#### 마커/카드 터치 (예상 위치)
```bash
# 첫 번째 카드
adb shell input tap 540 600

# 두 번째 카드
adb shell input tap 540 800
```

---

## 7단계: 자동화 시나리오

### 전체 화면 순회 캡처
```bash
# Windows에서 직접 실행 (adb는 PATH에 있음)

# Home
adb exec-out screencap -p > screen-home.png
timeout /t 1

# Search 탭
adb shell input tap 324 2300
timeout /t 2
adb exec-out screencap -p > screen-search.png

# Nearby 탭
adb shell input tap 540 2300
timeout /t 2
adb exec-out screencap -p > screen-nearby.png

# Saved 탭
adb shell input tap 756 2300
timeout /t 2
adb exec-out screencap -p > screen-saved.png

# Profile 탭
adb shell input tap 972 2300
timeout /t 2
adb exec-out screencap -p > screen-profile.png
```

### UI 자동 테스트
```bash
# Windows에서 직접 실행

# 1. 앱 실행
adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8081"
timeout /t 5

# 2. 검색 탭 이동
adb shell input tap 324 2300
timeout /t 2

# 3. 검색어 입력
adb shell input tap 540 150
timeout /t 1
adb shell input text "kids cafe"
adb shell input keyevent 66

timeout /t 3

# 4. 첫 번째 결과 선택
adb shell input tap 540 600
timeout /t 2

# 5. 스크린샷
adb exec-out screencap -p > screen-test-result.png
```

---

## 8단계: 로그 & 디버깅

### Logcat 실시간 모니터링
```bash
# React Native 로그만
adb logcat -s ReactNativeJS:V

# 에러만
adb logcat *:E

# 특정 태그
adb logcat -s Expo:V
```

### Metro Bundler 로그 확인
```bash
# 별도 터미널에서 Metro 실행 중이라면 그 출력 확인
# 또는 Expo Go 앱 내 Developer Menu
adb shell input keyevent 82  # 메뉴 키
```

### 앱 크래시 로그
```bash
adb logcat -b crash
```

---

## 9단계: 성능 모니터링

### CPU 사용률
```bash
adb shell top -n 1 | grep expo
```

### 메모리 사용
```bash
adb shell dumpsys meminfo host.exp.exponent
```

### 프레임 속도 (GPU rendering)
```bash
adb shell dumpsys gfxinfo host.exp.exponent
```

---

## 출력 형식

```markdown
## 에뮬레이터 제어 결과

### 디바이스 상태
- 연결: [연결됨/오프라인]
- 모델: [Pixel 8 등]
- 해상도: [1080x2400]

### 실행 내역
| 작업 | 결과 |
|------|------|
| 에뮬레이터 시작 | ✅/❌ |
| 앱 실행 | ✅/❌ |
| 스크린샷 | ✅/❌ |
| 터치 입력 | ✅/❌ |

### 캡처된 스크린샷
- screen-home.png
- screen-search.png
- ...

### 발견된 문제
1. [문제]

### 권장 조치
1. [조치]
```

$ARGUMENTS

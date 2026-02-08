---
name: emulator
description: Android 에뮬레이터 제어 명령어
allowed-tools:
  - "Bash(adb *)"
  - "Bash(emulator *)"
  - "Bash(sleep *)"
  - "Bash(timeout *)"
  - "Read(*.png)"
---

# 에뮬레이터 제어 명령어

> `/emulator` 또는 `/emu`로 호출

## 환경

```bash
# Windows: adb, emulator가 PATH에 있음 (직접 사용)
# AVD 이름
AVD="Medium_Phone_API_36.1"
```

## 빠른 명령

### 디바이스 확인
```bash
adb devices -l
```

### 에뮬레이터 시작
```bash
emulator -avd Medium_Phone_API_36.1 -no-snapshot-load &
timeout /t 30
adb wait-for-device
```

### 앱 실행 (Expo)
```bash
adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8081"
```

### 스크린샷
```bash
adb exec-out screencap -p > screen-check.png
```

### 터치 (X, Y)
```bash
adb shell input tap X Y
```

### 스크롤 다운
```bash
adb shell input swipe 540 1500 540 500 300
```

### 뒤로가기
```bash
adb shell input keyevent 4
```

### 앱 종료
```bash
adb shell am force-stop host.exp.exponent
```

### 에뮬레이터 종료
```bash
adb emu kill
```

## 파라미터

`$ARGUMENTS` - 추가 명령 (선택)

## 예시

```
/emulator start        # 에뮬레이터 시작
/emulator screenshot   # 스크린샷
/emulator tap 540 1200 # 좌표 터치
/emulator stop         # 종료
```

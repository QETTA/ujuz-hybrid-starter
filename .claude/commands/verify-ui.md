---
name: verify-ui
description: ADB 스크린샷으로 앱 UI 검증
allowed-tools:
  - "Bash(adb *)"
  - "Read(*.png)"
---

# UI 검증 명령어

ADB 스크린샷으로 앱 UI를 캡처하고 분석합니다.

## 실행 단계

1. ADB로 스크린샷 캡처
```bash
# Windows: adb가 PATH에 있음
adb -s emulator-5554 exec-out screencap -p > screen-check.png
```

2. 스크린샷 분석
- Read tool로 screen-check.png 읽기
- UI 요소 확인 (버튼, 텍스트, 레이아웃)
- 에러 상태 확인

3. Metro 로그 확인 (선택적)
- 백그라운드 태스크 출력 확인

$ARGUMENTS

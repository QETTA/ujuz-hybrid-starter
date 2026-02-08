# 학습된 에러 패턴

## 1. Tamagui 색상 타입 에러
```tsx
// ❌ 에러: Type 'string' is not assignable to type 'GetThemeValueForKey<"color">'
color: Colors.text

// ✅ 수정
color: Colors.text as any
```

## 2. WSL↔Windows 파일 동기화
- **증상**: Edit 후 tsc가 변경 인식 못함
- **해결**: WSL 네이티브 경로에서 sed 사용

## 3. Metro Non-Interactive
- **증상**: Input required in non-interactive mode
- **해결**: `npx expo login` 또는 EXPO_TOKEN 설정

## 4. react-native-worklets 버전 불일치
```bash
# Native 버전 확인
adb logcat -s ReactNativeJS:* | grep -i worklet

# JS 버전 맞춤
npm install react-native-worklets@<NATIVE_VERSION>
npx expo start --clear
```

## 5. SplashScreen Hydration 블로킹
- **증상**: 스플래시에서 멈춤
- **해결**: fallback 타임아웃 3초 추가

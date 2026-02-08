---
name: expo-performance
description: Expo 성능 최적화 가이드
allowed-tools:
  - "Bash(npm run *)"
  - "Bash(npx expo *)"
  - "Read(*)"
---

# Expo 성능 개선 가이드

## 문제 진단

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 첫 번들링 느림 (1-2분) | 캐시 없음 | 정상 (한 번만 걸림) |
| Hot reload 느림 | Metro 메모리 부족 | `start:stable` 사용 |
| 앱 시작 느림 | dev client 미사용 | `npx expo prebuild` |

## 즉시 적용

### 1. Metro 메모리 증가
```json
// package.json (이미 적용됨)
"start:stable": "cross-env NODE_OPTIONS=--max-old-space-size=4096 expo start --lan --clear"
```

사용:
```bash
npm run start:stable:sync
```

### 2. Metro 캐시 리셋 (느려질 때)
```bash
npx expo start --clear
```

### 3. Dev Client 사용 (장기 권장)
```bash
# Expo Go 대신 커스텀 빌드
npx expo prebuild
npx expo run:android

# 장점: 네이티브 모듈 사용 가능 (Mapbox 등)
# 단점: 빌드 시간 5-10분 (처음 한 번)
```

## 성능 비교

| 모드 | 첫 번들 | Hot Reload | Native 모듈 |
|------|---------|-----------|-------------|
| Expo Go | 20-40s | 2-5s | ❌ |
| Dev Client | 40-60s | 1-2s | ✅ |
| Production | 60-90s | - | ✅ |

## 지금 할 것

**현재 (Expo Go):**
- Metro 메모리 충분함 (4096MB)
- 첫 번들링은 어쩔 수 없음 (정상)
- 이후 hot reload는 빠를 것

**장기 (Dev Client 전환 권장):**
- Mapbox 사용하려면 필수
- 빌드 1회 투자 → 이후 개발 속도 향상

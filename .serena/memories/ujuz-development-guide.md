# UJUz (우쥬) 개발 가이드 (통합 참조 문서)

## 📌 프로젝트 개요
- **앱명**: UJUz (우쥬)
- **슬로건**: "우리 아이 입학 지도"
- **목적**: AI 기반 어린이집 입소 점수 예측 및 TO 알림 서비스
- **플랫폼**: React Native (Expo SDK 54)

---

## 🛠️ 기술 스택

### Core
- React Native 0.81.5 + Expo SDK 54
- TypeScript 5.9.2 (strict mode)
- Tamagui UI Framework (표준 UI 시스템)

### 상태 관리
- Zustand (클라이언트 상태)
- React Query (서버 상태)

### 백엔드
- MongoDB Atlas (메인 DB)
- Supabase (Auth)
- Redis + BullMQ (Job Queue)
- Toss Payments (결제)

### AI 통합
- Claude API (Intent Classification, Answer Generation)
- Streaming Response (실시간 답변)

### 네비게이션
- React Navigation v7
- Bottom Tabs + Stack Navigator

---

## 🎨 디자인 시스템

### 색상 사용법 (단일 소스: app/constants/Colors.ts)
```typescript
import { Colors } from '@/app/constants';

// 사용 예시
<View style={{ backgroundColor: Colors.iosSecondaryBackground }}>
  <Text style={{ color: Colors.iosLabel }}>텍스트</Text>
</View>
```

### 컴포넌트 import
```typescript
import { Button, Card, Badge, Text } from '@/app/design-system';
```

---

## 📁 프로젝트 구조

```
app/
├── components/           # 기능별 컴포넌트
│   ├── admission/       # 입소 점수 관련
│   ├── map/             # 지도 관련
│   ├── bot/             # 우주봇 관련
│   └── shared/          # 공유 컴포넌트
├── design-system/       # 디자인 시스템
│   └── components/      # Tamagui 기반 컴포넌트
├── screens/             # 화면 컴포넌트
├── navigation/          # 네비게이션 설정
├── stores/              # Zustand 스토어
├── services/            # API 서비스
├── hooks/               # 커스텀 훅
├── types/               # TypeScript 타입
└── constants/           # 상수 정의
```

---

## 📱 스크린 구조

### Tab Navigator
| 탭 | 스크린 | 설명 |
|----|--------|------|
| Home | HomeScreen | 대시보드/입소 점수 |
| Map | MapScreen | 어린이집 지도 |
| Deals | DealsScreen | 공동구매/혜택 |
| Saved | SavedScreen | 저장된 어린이집 |
| Ask | AskScreen | 우주봇 AI 상담 |

### Stack Navigator
- AdmissionScoreScreen - 입소 점수 상세
- ChildcareDetailScreen - 어린이집 상세
- SubscriptionScreen - 구독 관리
- AlertSettingsScreen - TO 알림 설정
- SettingsScreen - 설정

---

## 🔑 주요 Zustand Stores

| Store | 용도 |
|-------|------|
| useAuthStore | 인증 상태 관리 |
| useAdmissionStore | 입소 점수 데이터 |
| useChildStore | 자녀 정보 관리 |
| useSubscriptionStore | 구독 상태 |
| useAlertStore | TO 알림 설정 |
| useBotStore | 우주봇 대화 기록 |

---

## ✅ 코딩 컨벤션

1. **컴포넌트**: 함수형 컴포넌트 + React Hooks
2. **색상**: `Colors.xxx` 토큰 사용 (하드코딩 금지)
3. **타입**: 모든 props에 TypeScript 타입 정의 (app/types/)
4. **접근성**: accessibilityLabel, accessibilityRole 필수
5. **성능**: React.memo, useMemo, useCallback 적절히 사용
6. **경로**: `@/app/*` alias 사용

---

## 🚀 개발 명령어

```bash
# 개발 서버
npm run start:lan

# TypeScript 체크
npm run typecheck

# 크롤러 전체 실행
npm run crawler:all

# 서버 개발
npm run server:dev

# 빌드 (Android)
npm run build:android

# 빌드 (iOS)
npm run build:ios
```

---

## 📅 마지막 업데이트
- 2026-02-04
- UJUz 리브랜딩 완료
- v3 마스터 플랜 적용
- Claude API 통합 준비

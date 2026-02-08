# UJUz (우쥬) - Project Overview

## Purpose
UJUz는 AI 기반 어린이집 입소 점수 예측, TO 알림, 우주봇 상담 기능을 제공하는 풀스택 모노레포입니다.
모바일(React Native + Expo), API 서버(Express), AI/알림 워커로 구성됩니다.

**리브랜딩**: KidsMap → UJUz (우쥬) 단일 브랜드 (2026-02-04)
**모노레포 전환**: kidsmap-mobile → ujuz-hybrid-starter (2026-02-08)

## Tech Stack

### Core
- **Framework**: React Native 0.81.5 with Expo ~54.0.33
- **Language**: TypeScript 5.9.2 (strict mode enabled)
- **Runtime**: React 19.1.0

### Navigation & UI
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: Zustand 5.0.11 (with AsyncStorage persistence)
- **Maps**: Mapbox (@rnmapbox/maps)
- **Animations**: React Native Reanimated 4.1.1
- **Gestures**: React Native Gesture Handler 2.28.0
- **Bottom Sheets**: @gorhom/bottom-sheet 5.2.8
- **UI Effects**: expo-blur, expo-linear-gradient
- **UI Framework**: Tamagui

### Services & Utilities
- **HTTP Client**: Axios 1.13.4
- **Storage**: @react-native-async-storage/async-storage 2.2.0
- **Location**: expo-location 19.0.8
- **Network Status**: @react-native-community/netinfo 11.4.1
- **Date Utilities**: date-fns 4.1.0
- **Icons**: @expo/vector-icons 15.0.3

### Backend Integration
- **Database**: MongoDB Atlas
- **Queue**: BullMQ + Redis
- **Auth**: Supabase Auth
- **Payment**: Toss Payments
- **AI**: Claude API (Intent Classification, Answer Generation)

## Key Features
- 입소 점수 예측 (Admission Score)
- TO 알림 서비스 (Push Notifications)
- 우주봇 AI 상담
- 프리미엄 구독 서비스
- 어린이집 지도 & 검색
- 맘카페 커뮤니티 크롤링

## Monorepo Structure
- **apps/mobile/**: React Native / Expo 모바일 앱
- **apps/api/**: Express 백엔드 (구 server/)
- **apps/worker-ai/**: AI 처리 워커
- **apps/worker-alerts/**: 알림 워커
- **packages/config/**: 공유 설정
- **packages/db/**: MongoDB 클라이언트
- **packages/shared/**: 공유 유틸리티/타입

## Project Status
- **Current Phase**: 모노레포 안정화 + v3 Master Plan 실행 준비
- **Roadmap**: docs/ 참조

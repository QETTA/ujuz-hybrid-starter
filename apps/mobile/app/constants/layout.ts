/**
 * KidsMap Mobile - Layout Constants
 */

import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // 2026 Toss-style border radius tokens
  borderRadius: {
    xs: 4, // micro elements
    sm: 8, // chips, tags
    md: 12, // buttons, inputs (토스 기본)
    lg: 16, // cards, modals
    xl: 20, // large cards
    xxl: 24, // bottom sheets
    full: 9999, // avatars, FAB
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  screenPadding: 20,
  hitSlop: 12,
  stagger: {
    delay: 60,
    damping: 18,
  },
  headerHeight: Platform.select({ ios: 88, android: 56, default: 64 }),
  tabBarHeight: Platform.select({ ios: 83, android: 56, default: 60 }),
};

/**
 * @deprecated Shadows from '@/app/constants' (design-system/tokens/shadows.ts) 사용 권장
 * 이 객체는 하위 호환성을 위해 유지됩니다.
 */
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

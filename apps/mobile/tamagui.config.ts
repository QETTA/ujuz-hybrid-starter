/**
 * Tamagui Configuration
 *
 * UJUz 디자인 시스템을 Tamagui 형식으로 매핑
 */

import { createTamagui, createTokens } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { tokens as defaultTokens } from '@tamagui/config/v3';
import { createAnimations } from '@tamagui/animations-react-native';

// UJUz 디자인 토큰에서 가져온 색상 (2026 Design System)
// 토스 2026 스타일: 밝고 부드러운 민트 그린 계열
export const ujuzColors = {
  // Primary Brand Colors - Toss-style Soft Mint Green
  primary50: '#F0FDF9',   // nearly white mint
  primary100: '#CCFBEF',  // very light mint
  primary200: '#99F6DE',  // light mint
  primary300: '#5EEAD4',  // soft mint
  primary400: '#2DD4BF',  // toss-style teal
  primary500: '#5DDB9E',  // UJUz Mint (메인 컬러) - 부드럽고 밝음
  primary600: '#4ACA8C',  // medium mint
  primary700: '#38B97A',  // deep mint
  primary800: '#26A768',  // dark mint
  primary900: '#149656',  // darkest mint

  // Semantic Colors
  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#059669',
  successBg: '#ecfdf5',

  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#d97706',
  warningBg: '#fffbeb',

  error: '#ef4444',
  errorLight: '#fee2e2',
  errorDark: '#dc2626',
  errorBg: '#fef2f2',

  info: '#0EA5E9',      // sky blue (info용 - primary와 구분)
  infoLight: '#E0F2FE',
  infoDark: '#0284C7',
  infoBg: '#F0F9FF',

  // Neutral Grays
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Special
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Social Colors
  like: '#ec4899',
  share: '#3b82f6',
  save: '#f59e0b',
  star: '#fbbf24',

  // Badge Colors (Trust Indicators)
  badgeVerified: '#10b981',
  badgeVerifiedBg: '#ecfdf5',
  badgePopular: '#ec4899',
  badgePopularBg: '#fdf2f8',
  badgeNew: '#1e40af',
  badgeNewBg: '#dbeafe',
  badgeHot: '#991b1b',
  badgeHotBg: '#fee2e2',
  badgeSale: '#92400e',
  badgeSaleBg: '#fef3c7',
  badgeRecommended: '#6b21a8',
  badgeRecommendedBg: '#f3e8ff',

  // Category Colors
  categoryOutdoor: '#10b981',
  categoryOutdoorBg: '#d1fae5',
  categoryIndoor: '#f59e0b',
  categoryIndoorBg: '#fef3c7',
  categoryPublic: '#3b82f6',
  categoryPublicBg: '#dbeafe',
  categoryRestaurant: '#ef4444',
  categoryRestaurantBg: '#fee2e2',

  // Glass/Surface Colors (2026 Glassmorphism)
  glassLight: 'rgba(255, 255, 255, 0.7)',
  glassMedium: 'rgba(255, 255, 255, 0.5)',
  glassDark: 'rgba(255, 255, 255, 0.3)',
  glassOverlay: 'rgba(0, 0, 0, 0.3)',
};

// 커스텀 토큰 생성
const tokens = createTokens({
  ...defaultTokens,
  color: {
    ...defaultTokens.color,
    ...ujuzColors,
  },
  space: {
    ...defaultTokens.space,
    // 8pt grid system
    0: 0,
    1: 4, // xs
    2: 8, // sm
    3: 12,
    4: 16, // md
    5: 20,
    6: 24, // lg
    7: 28,
    8: 32, // xl
    9: 36,
    10: 40,
    12: 48, // xxl
    16: 64, // xxxl
    true: 16, // default
  },
  size: {
    ...defaultTokens.size,
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    16: 64,
    true: 16,
  },
  radius: {
    ...defaultTokens.radius,
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    full: 9999,
    true: 8,
  },
  zIndex: {
    ...defaultTokens.zIndex,
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
});

// Inter 폰트 설정
const headingFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 40,
    10: 48,
    true: 16,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
  letterSpacing: {
    4: 0,
    5: -0.25,
    6: -0.5,
    7: -0.5,
  },
  face: {
    400: { normal: 'Inter' },
    500: { normal: 'InterMedium' },
    600: { normal: 'InterSemiBold' },
    700: { normal: 'InterBold' },
  },
});

const bodyFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 17,
    5: 18,
    6: 20,
    true: 17,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
  },
  letterSpacing: {
    4: 0,
    5: -0.4,
  },
  face: {
    400: { normal: 'Inter' },
    500: { normal: 'InterMedium' },
    600: { normal: 'InterSemiBold' },
  },
});

// 애니메이션 설정 (iOS 스타일 spring physics + 2026 micro-interactions)
const animations = createAnimations({
  fast: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: 'spring',
    damping: 15,
    mass: 1,
    stiffness: 180,
  },
  slow: {
    type: 'spring',
    damping: 20,
    mass: 0.9,
    stiffness: 100,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 200,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  // 2026 Micro-interaction presets
  press: {
    type: 'spring',
    damping: 25,
    mass: 0.8,
    stiffness: 400,
  },
  float: {
    type: 'spring',
    damping: 12,
    mass: 1,
    stiffness: 100,
  },
  snap: {
    type: 'spring',
    damping: 30,
    mass: 0.6,
    stiffness: 500,
  },
  gentle: {
    type: 'spring',
    damping: 18,
    mass: 1.2,
    stiffness: 120,
  },
});

// Light 테마 (2026 Design System)
const lightTheme = {
  background: ujuzColors.white,
  backgroundHover: ujuzColors.gray50,
  backgroundPress: ujuzColors.gray100,
  backgroundFocus: ujuzColors.gray50,
  backgroundStrong: ujuzColors.gray100,
  backgroundTransparent: ujuzColors.transparent,

  color: ujuzColors.gray900,
  colorHover: ujuzColors.gray800,
  colorPress: ujuzColors.gray700,
  colorFocus: ujuzColors.gray800,
  colorTransparent: 'rgba(17, 24, 39, 0)',

  borderColor: ujuzColors.gray200,
  borderColorHover: ujuzColors.gray300,
  borderColorPress: ujuzColors.gray400,
  borderColorFocus: ujuzColors.primary500,

  placeholderColor: ujuzColors.gray400,

  // Semantic
  primary: ujuzColors.primary500,
  primaryHover: ujuzColors.primary600,
  primaryPress: ujuzColors.primary700,
  primaryLight: ujuzColors.primary100,

  secondary: ujuzColors.gray500,
  secondaryHover: ujuzColors.gray600,
  secondaryPress: ujuzColors.gray700,

  success: ujuzColors.success,
  successLight: ujuzColors.successLight,
  successBg: ujuzColors.successBg,
  warning: ujuzColors.warning,
  warningLight: ujuzColors.warningLight,
  warningBg: ujuzColors.warningBg,
  error: ujuzColors.error,
  errorLight: ujuzColors.errorLight,
  errorBg: ujuzColors.errorBg,
  info: ujuzColors.info,
  infoLight: ujuzColors.infoLight,
  infoBg: ujuzColors.infoBg,

  // Card
  card: ujuzColors.white,
  cardHover: ujuzColors.gray50,

  // Surface
  surface: ujuzColors.gray50,
  surfaceHover: ujuzColors.gray100,
  surfaceElevated: ujuzColors.white,
  surfaceMuted: ujuzColors.gray100,

  // Text variants
  textPrimary: ujuzColors.gray900,
  textSecondary: ujuzColors.gray500,
  textTertiary: ujuzColors.gray400,
  textInverse: ujuzColors.white,
  textLink: ujuzColors.primary500,
  textMuted: ujuzColors.gray600,

  // Badge Colors (Trust Indicators)
  badgeVerified: ujuzColors.badgeVerified,
  badgeVerifiedBg: ujuzColors.badgeVerifiedBg,
  badgePopular: ujuzColors.badgePopular,
  badgePopularBg: ujuzColors.badgePopularBg,
  badgeNew: ujuzColors.badgeNew,
  badgeNewBg: ujuzColors.badgeNewBg,
  badgeHot: ujuzColors.badgeHot,
  badgeHotBg: ujuzColors.badgeHotBg,
  badgeSale: ujuzColors.badgeSale,
  badgeSaleBg: ujuzColors.badgeSaleBg,
  badgeRecommended: ujuzColors.badgeRecommended,
  badgeRecommendedBg: ujuzColors.badgeRecommendedBg,

  // Category Colors
  categoryOutdoor: ujuzColors.categoryOutdoor,
  categoryOutdoorBg: ujuzColors.categoryOutdoorBg,
  categoryIndoor: ujuzColors.categoryIndoor,
  categoryIndoorBg: ujuzColors.categoryIndoorBg,
  categoryPublic: ujuzColors.categoryPublic,
  categoryPublicBg: ujuzColors.categoryPublicBg,
  categoryRestaurant: ujuzColors.categoryRestaurant,
  categoryRestaurantBg: ujuzColors.categoryRestaurantBg,

  // Glass/Surface (2026 Glassmorphism)
  glassLight: ujuzColors.glassLight,
  glassMedium: ujuzColors.glassMedium,
  glassDark: ujuzColors.glassDark,
  glassOverlay: ujuzColors.glassOverlay,

  // Social Colors
  socialLike: ujuzColors.like,
  socialShare: ujuzColors.share,
  socialSave: ujuzColors.save,
  socialStar: ujuzColors.star,

  // Shadow (for elevation) - Toss 2026 style: subtle shadows
  shadowColor: 'rgba(0, 0, 0, 0.04)',      // 토스 기본 그림자
  shadowColorStrong: 'rgba(0, 0, 0, 0.08)', // 강조 그림자
  shadowColorSubtle: 'rgba(0, 0, 0, 0.02)', // 미세 그림자
};

// Dark 테마 (2026 Design System)
const darkTheme = {
  background: ujuzColors.gray900,
  backgroundHover: ujuzColors.gray800,
  backgroundPress: ujuzColors.gray700,
  backgroundFocus: ujuzColors.gray800,
  backgroundStrong: ujuzColors.black,
  backgroundTransparent: ujuzColors.transparent,

  color: ujuzColors.white,
  colorHover: ujuzColors.gray100,
  colorPress: ujuzColors.gray200,
  colorFocus: ujuzColors.gray100,
  colorTransparent: 'rgba(255, 255, 255, 0)',

  borderColor: ujuzColors.gray700,
  borderColorHover: ujuzColors.gray600,
  borderColorPress: ujuzColors.gray500,
  borderColorFocus: ujuzColors.primary400,

  placeholderColor: ujuzColors.gray500,

  // Semantic
  primary: ujuzColors.primary400,
  primaryHover: ujuzColors.primary500,
  primaryPress: ujuzColors.primary600,
  primaryLight: ujuzColors.primary800,

  secondary: ujuzColors.gray400,
  secondaryHover: ujuzColors.gray300,
  secondaryPress: ujuzColors.gray200,

  success: ujuzColors.success,
  successLight: ujuzColors.successDark,
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: ujuzColors.warning,
  warningLight: ujuzColors.warningDark,
  warningBg: 'rgba(245, 158, 11, 0.15)',
  error: ujuzColors.error,
  errorLight: ujuzColors.errorDark,
  errorBg: 'rgba(239, 68, 68, 0.15)',
  info: ujuzColors.info,
  infoLight: ujuzColors.infoDark,
  infoBg: 'rgba(59, 130, 246, 0.15)',

  // Card
  card: ujuzColors.gray800,
  cardHover: ujuzColors.gray700,

  // Surface
  surface: ujuzColors.gray800,
  surfaceHover: ujuzColors.gray700,
  surfaceElevated: ujuzColors.gray700,
  surfaceMuted: ujuzColors.gray800,

  // Text variants
  textPrimary: ujuzColors.white,
  textSecondary: ujuzColors.gray400,
  textTertiary: ujuzColors.gray500,
  textInverse: ujuzColors.gray900,
  textLink: ujuzColors.primary400,
  textMuted: ujuzColors.gray500,

  // Badge Colors (Trust Indicators) - adjusted for dark mode
  badgeVerified: ujuzColors.success,
  badgeVerifiedBg: 'rgba(16, 185, 129, 0.15)',
  badgePopular: ujuzColors.like,
  badgePopularBg: 'rgba(236, 72, 153, 0.15)',
  badgeNew: ujuzColors.primary400,
  badgeNewBg: 'rgba(59, 130, 246, 0.15)',
  badgeHot: ujuzColors.error,
  badgeHotBg: 'rgba(239, 68, 68, 0.15)',
  badgeSale: ujuzColors.warning,
  badgeSaleBg: 'rgba(245, 158, 11, 0.15)',
  badgeRecommended: '#a855f7',
  badgeRecommendedBg: 'rgba(168, 85, 247, 0.15)',

  // Category Colors - adjusted for dark mode
  categoryOutdoor: ujuzColors.success,
  categoryOutdoorBg: 'rgba(16, 185, 129, 0.15)',
  categoryIndoor: ujuzColors.warning,
  categoryIndoorBg: 'rgba(245, 158, 11, 0.15)',
  categoryPublic: ujuzColors.primary400,
  categoryPublicBg: 'rgba(59, 130, 246, 0.15)',
  categoryRestaurant: ujuzColors.error,
  categoryRestaurantBg: 'rgba(239, 68, 68, 0.15)',

  // Glass/Surface (2026 Glassmorphism) - dark mode
  glassLight: 'rgba(30, 41, 59, 0.7)',
  glassMedium: 'rgba(30, 41, 59, 0.5)',
  glassDark: 'rgba(30, 41, 59, 0.3)',
  glassOverlay: 'rgba(0, 0, 0, 0.5)',

  // Social Colors
  socialLike: ujuzColors.like,
  socialShare: ujuzColors.primary400,
  socialSave: ujuzColors.warning,
  socialStar: ujuzColors.star,

  // Shadow
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  shadowColorStrong: 'rgba(0, 0, 0, 0.5)',
  shadowColorSubtle: 'rgba(0, 0, 0, 0.2)',
};

// Tamagui 설정 생성
const config = createTamagui({
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  animations,
  shorthands,
  settings: {
    allowedStyleValues: 'somewhat-strict-web',
    autocompleteSpecificTokens: 'except-special',
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;

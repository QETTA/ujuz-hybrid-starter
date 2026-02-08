/**
 * UJUz Mobile - Color Constants
 *
 * Re-export pattern: tamagui.config.ts가 단일 소스
 * 기존 코드와의 호환성을 위해 이 파일을 통해 접근
 */

import { ujuzColors } from '@/tamagui.config';

const withAlpha = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const iosSystemRed = '#FF3B30';

// 기존 Colors 인터페이스와 호환되는 re-export
export const Colors = {
  // Primary Colors
  primary: ujuzColors.primary500,
  primaryDark: ujuzColors.primary600,
  primaryLight: ujuzColors.primary400,
  primary700: ujuzColors.primary700,
  secondary: ujuzColors.gray500,

  // Background
  background: ujuzColors.white,
  backgroundSecondary: ujuzColors.gray50,
  backgroundDark: ujuzColors.gray900,

  // Text
  text: ujuzColors.gray900,
  textSecondary: ujuzColors.gray500,
  textTertiary: ujuzColors.gray400,
  textLight: ujuzColors.white,

  // Gray Scale (전체)
  gray50: ujuzColors.gray50,
  gray100: ujuzColors.gray100,
  gray200: ujuzColors.gray200,
  gray300: ujuzColors.gray300,
  gray400: ujuzColors.gray400,
  gray500: ujuzColors.gray500,
  gray600: ujuzColors.gray600,
  gray700: ujuzColors.gray700,
  gray800: ujuzColors.gray800,
  gray900: ujuzColors.gray900,

  // Border
  border: ujuzColors.gray200,
  borderDark: ujuzColors.gray300,

  // Status
  success: ujuzColors.success,
  error: ujuzColors.error,
  warning: ujuzColors.warning,
  info: ujuzColors.info,

  // Rating
  ratingStar: ujuzColors.star,
  ratingStarEmpty: ujuzColors.gray300,

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

  // Premium (공동구매 등)
  premium: ujuzColors.warning,
  premiumDark: ujuzColors.warningDark,

  // Filter Categories
  outdoor: ujuzColors.categoryOutdoor,
  indoor: ujuzColors.categoryIndoor,
  public: ujuzColors.categoryPublic,
  restaurant: ujuzColors.categoryRestaurant,

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: ujuzColors.glassOverlay,

  // Glass (restrained usage)
  glassLight: ujuzColors.glassLight,
  glassMedium: ujuzColors.glassMedium,
  glassDark: ujuzColors.glassDark,

  // Gradient Colors (for LinearGradient components)
  // Based on primary500 (#03C75A = rgb(3, 199, 90))
  primaryGradientStrong: 'rgba(3, 199, 90, 0.12)',
  primaryGradientMedium: 'rgba(3, 199, 90, 0.04)',
  primaryGradientLight: 'rgba(3, 199, 90, 0.02)',
  gradientTransparent: 'rgba(255, 255, 255, 0)',

  // Interactive
  ripple: 'rgba(0, 0, 0, 0.1)',
  selected: ujuzColors.primary50,
  hover: ujuzColors.gray100,

  // White/Black (자주 사용됨)
  white: ujuzColors.white,
  black: ujuzColors.black,

  // Primary with Alpha (Toss-style)
  primaryAlpha10: withAlpha(ujuzColors.primary500, 0.1),
  primaryAlpha15: withAlpha(ujuzColors.primary500, 0.15),
  primaryAlpha20: withAlpha(ujuzColors.primary500, 0.2),

  // iOS System Colors (HIG 준수) - 점진적 deprecation
  iosLabel: '#1C1C1E',
  iosSecondaryLabel: '#3C3C43',
  iosTertiaryLabel: '#8E8E93',
  iosQuaternaryLabel: '#C7C7CC',
  iosSystemBackground: '#FFFFFF',
  iosSecondaryBackground: '#F2F2F7',
  iosSeparator: '#C6C6C8',
  /** @deprecated iOS 표준 블루로 복원. 네비게이션은 Colors.navActive 사용 권장 */
  iosSystemBlue: '#007AFF',
  /** @deprecated Use Colors.primaryAlpha10 instead */
  iosSystemBlueAlpha10: withAlpha('#007AFF', 0.1),
  iosSystemBlueAlpha08: withAlpha('#007AFF', 0.08),
  iosSystemBlueAlpha20: withAlpha('#007AFF', 0.2),
  iosSystemRed,
  iosSystemRedAlpha10: withAlpha(iosSystemRed, 0.1),
  iosSystemRedAlpha08: withAlpha(iosSystemRed, 0.08),
  iosSystemRedAlpha15: withAlpha(iosSystemRed, 0.15),
  iosSystemRedAlpha20: withAlpha(iosSystemRed, 0.2),
  iosSystemRedAlpha95: withAlpha(iosSystemRed, 0.95),
  iosSystemOrange: '#FF9500',
  iosSystemOrangeAlpha10: 'rgba(255, 149, 0, 0.1)',
  iosSystemGreen: '#34C759',

  // Additional Gray Scale
  iosQuaternaryFill: '#D1D1D6',
  iosFill: '#E5E5EA',

  // Toss-style Neutral
  tossGray50: '#F2F4F6',
  tossGray600: '#4E5968',
  tossGray800: '#191F28',

  // Overlay variations
  overlayDark: 'rgba(0, 0, 0, 0.6)',
  overlayDark80: 'rgba(0, 0, 0, 0.8)',
  overlayMedium: 'rgba(0, 0, 0, 0.5)',
  overlayDark40: 'rgba(0, 0, 0, 0.4)',
  overlayLight20: 'rgba(0, 0, 0, 0.2)',

  // White Alpha Scale
  whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
  whiteAlpha15: 'rgba(255, 255, 255, 0.15)',
  whiteAlpha20: 'rgba(255, 255, 255, 0.2)',
  whiteAlpha25: 'rgba(255, 255, 255, 0.25)',
  whiteAlpha30: 'rgba(255, 255, 255, 0.3)',
  whiteAlpha70: 'rgba(255, 255, 255, 0.7)',
  whiteAlpha18: 'rgba(255, 255, 255, 0.18)',
  whiteAlpha80: 'rgba(255, 255, 255, 0.8)',
  whiteAlpha85: 'rgba(255, 255, 255, 0.85)',

  // Black Alpha Scale
  blackAlpha3: 'rgba(0, 0, 0, 0.03)',
  blackAlpha5: 'rgba(0, 0, 0, 0.05)',
  blackAlpha8: 'rgba(0, 0, 0, 0.08)',
  blackAlpha10: 'rgba(0, 0, 0, 0.1)',
  blackAlpha30: 'rgba(0, 0, 0, 0.3)',
  blackAlpha40: 'rgba(0, 0, 0, 0.4)',
  blackAlpha50: 'rgba(0, 0, 0, 0.5)',
  blackAlpha70: 'rgba(0, 0, 0, 0.7)',
  blackAlpha75: 'rgba(0, 0, 0, 0.75)',

  // Navigation Blue Alpha
  navActiveAlpha08: withAlpha('#0EA5E9', 0.08),
  navActiveAlpha20: withAlpha('#0EA5E9', 0.2),

  // Success Green Alpha
  successAlpha10: withAlpha('#34C759', 0.1),
  successAlpha15: withAlpha('#34C759', 0.15),

  // Success/Semantic
  successMint: '#10B981',
  successMintBg: '#D1FAE5',

  // Grade Backgrounds (입학 가능성 결과)
  gradeBgA: '#E8F5E9',
  gradeBgB: '#E3F2FD',
  gradeBgC: '#FFF8E1',
  gradeBgD: '#FFF3E0',
  gradeBgF: '#FFEBEE',

  // Link
  link: '#007AFF',

  // Brand Gradients
  brandSplashGradient: ['#F7FAFF', '#EAF2FF', '#FFFFFF'] as const,
  darkGradient: ['#0A0A0A', '#0F1419', '#0A0A0A'] as const,

  // Dark Mode Surfaces
  darkBg: '#0A0A0A',
  darkSurface: '#161616',
  darkSurfaceElevated: '#1C1C1E',
  darkBorder: 'rgba(255, 255, 255, 0.06)',
  darkTextPrimary: '#F5F5F7',
  darkTextSecondary: '#8E8E93',
  darkTextTertiary: '#636366',

  // Semantic Navigation & CTA Colors (V2026.1)
  // 토큰 의미 분리: iOS 플랫폼 색상과 앱 기능별 색상을 명시적으로 구분
  navActive: ujuzColors.info, // #0EA5E9 (블루 - 활성 탭/네비게이션)
  navInactive: ujuzColors.gray500, // #6b7280 (비활성 네비게이션)
  ctaPrimary: ujuzColors.primary500, // #5DDB9E (민트 - Execute CTA만 사용)

  // Glass Components (for TamaguiGlassCard)
  glassOverlay: ujuzColors.glassOverlay, // 'rgba(0, 0, 0, 0.3)'
  glassReflection: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)'] as const,
};

// 카테고리 색상 (기존 호환성)
export const FilterCategoryColors = {
  outdoor: Colors.outdoor,
  indoor: Colors.indoor,
  public: Colors.public,
  restaurant: Colors.restaurant,
};

// 전체 토큰 접근용 (새 코드에서 사용 권장)
export { ujuzColors };

export default Colors;

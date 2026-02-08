/**
 * Design System - Colors
 *
 * @deprecated 이 파일은 더 이상 권장되지 않습니다.
 *
 * 대신 다음을 사용하세요:
 * - Tamagui 컴포넌트: useTheme() 훅으로 $primary, $background 등 토큰 사용
 * - StyleSheet 컴포넌트: import { Colors } from '@/app/constants'
 * - 전체 토큰: import { kidsMapColors } from '@/tamagui.config'
 *
 * 단일 소스: tamagui.config.ts
 */

export const Colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Semantic Colors
  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#059669',
  },

  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#d97706',
  },

  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
  },

  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#2563eb',
  },

  // Trust & Engagement Colors (NEW)
  verified: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#059669',
    bg: '#ecfdf5',
  },

  premium: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#d97706',
    bg: '#fffbeb',
  },

  popular: {
    light: '#fce7f3',
    main: '#ec4899',
    dark: '#db2777',
    bg: '#fdf2f8',
  },

  rating: {
    star: '#fbbf24',
    starEmpty: '#d1d5db',
    bg: '#fffbeb',
  },

  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Category Colors (장소 카테고리별)
  category: {
    outdoor: {
      light: '#d1fae5',
      main: '#10b981',
      dark: '#059669',
      icon: '#10b981',
      gradient: ['#10b981', '#059669'],
    },
    indoor: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#d97706',
      icon: '#f59e0b',
      gradient: ['#f59e0b', '#d97706'],
    },
    public: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#2563eb',
      icon: '#3b82f6',
      gradient: ['#3b82f6', '#2563eb'],
    },
    restaurant: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#dc2626',
      icon: '#ef4444',
      gradient: ['#ef4444', '#dc2626'],
    },
  },

  // Special Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    card: '#ffffff',
    elevated: '#ffffff',
  },

  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    link: '#3b82f6',
  },

  border: {
    light: '#f3f4f6',
    main: '#e5e7eb',
    dark: '#d1d5db',
    focus: '#3b82f6',
  },

  // Overlay
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },

  // Badge Colors (NEW)
  badge: {
    new: {
      bg: '#dbeafe',
      text: '#1e40af',
    },
    hot: {
      bg: '#fee2e2',
      text: '#991b1b',
    },
    sale: {
      bg: '#fef3c7',
      text: '#92400e',
    },
    recommended: {
      bg: '#f3e8ff',
      text: '#6b21a8',
    },
  },

  // Social Colors (NEW)
  social: {
    like: '#ec4899',
    share: '#3b82f6',
    save: '#f59e0b',
    comment: '#6b7280',
  },

  // White & Black
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // iOS System Colors (Human Interface Guidelines)
  // Used for native iOS look in iOS26+ styled components
  ios: {
    // Labels
    label: '#1C1C1E',
    secondaryLabel: '#3C3C43',
    tertiaryLabel: '#8E8E93',
    quaternaryLabel: '#C7C7CC',

    // System Backgrounds
    systemBackground: '#FFFFFF',
    secondarySystemBackground: '#F2F2F7',
    tertiarySystemBackground: '#E5E5EA',

    // System Colors
    systemRed: '#FF3B30',
    systemOrange: '#FF9500',
    systemYellow: '#FFCC00',
    systemGreen: '#34C759',
    systemMint: '#00C7BE',
    systemTeal: '#30B0C7',
    systemCyan: '#32ADE6',
    systemBlue: '#007AFF',
    systemIndigo: '#5856D6',
    systemPurple: '#AF52DE',
    systemPink: '#FF2D55',

    // Gray Colors
    systemGray: '#8E8E93',
    systemGray2: '#AEAEB2',
    systemGray3: '#C7C7CC',
    systemGray4: '#D1D1D6',
    systemGray5: '#E5E5EA',
    systemGray6: '#F2F2F7',

    // Separators
    separator: '#C6C6C8',
    opaqueSeparator: '#C6C6C8',
  },
} as const;

export type ColorName = keyof typeof Colors;

export default Colors;

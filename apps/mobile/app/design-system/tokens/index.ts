/**
 * Design System - Tokens
 *
 * 모든 디자인 토큰을 한 곳에서 export합니다.
 */

export { Typography, type TypographyVariant } from './typography';
export { Spacing, type SpacingSize } from './spacing';
export { Shadows, type ShadowSize } from './shadows';
export { Animations, type AnimationDuration, type AnimationEasing } from './animations';
export { Glass, Depths, Glows, Borders, MaterialPresets, createGlassStyle } from './materials';

/**
 * @deprecated 스크린/컴포넌트에서는 `import { Colors } from '@/app/constants'` 사용 권장.
 * 이 객체는 design-system 내부 컴포넌트 하위 호환용으로만 유지됩니다.
 *
 * Button, Card 등 기존 RN StyleSheet 기반 컴포넌트에서 사용.
 * Tamagui 테마 토큰($primary 등)과 별도로 관리.
 */
export const Colors = {
  primary: {
    500: '#5DDB9E',
    400: '#7EE5B5',
    600: '#3DC97E',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  error: {
    main: '#EF4444',
  },
  border: {
    main: '#E5E7EB',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
  },
};

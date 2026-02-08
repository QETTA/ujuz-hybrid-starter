/**
 * KidsMap Mobile - Constants Index
 *
 * 통합 re-export: design-system/tokens의 모든 토큰을 여기서 제공
 * 새 코드는 @/app/constants에서 import하세요
 */

export * from './Colors';
export * from './dimensions';
export * from './layout';
export * from './timing';

// Design System Tokens Re-export
export { Typography, type TypographyVariant } from '@/app/design-system/tokens/typography';
export { Spacing, type SpacingSize } from '@/app/design-system/tokens/spacing';
export { Shadows, type ShadowSize } from '@/app/design-system/tokens/shadows';
export {
  Animations,
  type AnimationDuration,
  type AnimationEasing,
} from '@/app/design-system/tokens/animations';
export {
  Glass,
  Depths,
  Glows,
  Borders,
  MaterialPresets,
  createGlassStyle,
} from '@/app/design-system/tokens/materials';

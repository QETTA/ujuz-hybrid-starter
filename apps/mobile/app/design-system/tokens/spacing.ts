/**
 * Design System - Spacing
 *
 * 8pt grid system 기반 일관된 간격을 제공합니다.
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type SpacingSize = keyof typeof Spacing;

export default Spacing;

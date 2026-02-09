/**
 * UJUz Design System - Tamagui Components
 * 2026 Design System
 */

// Foundation Components (Tamagui)
export { default as TamaguiButton, type TamaguiButtonProps } from './TamaguiButton';
export { default as TamaguiCard, type TamaguiCardProps } from './TamaguiCard';
export { default as TamaguiBadge, type TamaguiBadgeProps } from './TamaguiBadge';

// 2026 Design Trend Components
export { TamaguiText, type TamaguiTextProps } from './TamaguiText';
export { TamaguiGlassCard, type TamaguiGlassCardProps } from './TamaguiGlassCard';
export { TamaguiFloatingCard, type TamaguiFloatingCardProps } from './TamaguiFloatingCard';
export {
  TamaguiBentoGrid,
  TamaguiBentoCell,
  TamaguiBentoGridContainer,
  type TamaguiBentoCellProps,
  type TamaguiBentoGridProps,
} from './TamaguiBentoGrid';

// Utility Components (Phase 3)
export {
  TamaguiAvatar,
  type TamaguiAvatarProps,
  type AvatarSize,
  type AvatarStatus,
  type AvatarRing,
} from './TamaguiAvatar';
export {
  TamaguiSkeleton,
  TamaguiSkeletonGroup,
  type TamaguiSkeletonProps,
  type TamaguiSkeletonGroupProps,
  type SkeletonVariant,
  type SkeletonWidth,
} from './TamaguiSkeleton';
export {
  TamaguiDivider,
  type TamaguiDividerProps,
  type DividerOrientation,
  type DividerSpacing,
  type DividerVariant,
} from './TamaguiDivider';
export {
  TamaguiChip,
  TamaguiChipGroup,
  type TamaguiChipProps,
  type TamaguiChipGroupProps,
  type ChipVariant,
  type ChipSize,
} from './TamaguiChip';

// Feedback & State Components
export { default as TamaguiLoading, type TamaguiLoadingProps } from './TamaguiLoading';
export {
  default as TamaguiLoadingSpinner,
  type TamaguiLoadingSpinnerProps,
} from './TamaguiLoadingSpinner';
export { default as TamaguiEmptyState, type TamaguiEmptyStateProps } from './TamaguiEmptyState';
export { default as TamaguiErrorView, type TamaguiErrorViewProps } from './TamaguiErrorView';
export {
  default as TamaguiPlaceCardSkeleton,
  type TamaguiPlaceCardSkeletonProps,
} from './TamaguiPlaceCardSkeleton';
export {
  default as TamaguiListSkeleton,
  type TamaguiListSkeletonProps,
} from './TamaguiListSkeleton';
export { default as TamaguiRatingStars, type TamaguiRatingStarsProps } from './TamaguiRatingStars';

// Screen Wrapper (2026 Glassmorphism)
export { GradientScaffold, type GradientVariant } from './GradientScaffold';

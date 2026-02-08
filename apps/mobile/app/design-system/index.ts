/**
 * UJUz Design System
 *
 * 일관된 UI/UX를 위한 디자인 시스템
 */

// Tokens
export * from './tokens';

// Legacy Components (still used in PlaceCard.ios26)
export { Badge, type BadgeVariant, type BadgeSize } from './components/Badge';
export { Rating } from './components/Rating';

// Tamagui Feedback & State Components
export { default as TamaguiLoading, type TamaguiLoadingProps } from './components/TamaguiLoading';
export {
  default as TamaguiLoadingSpinner,
  type TamaguiLoadingSpinnerProps,
} from './components/TamaguiLoadingSpinner';
export {
  default as TamaguiEmptyState,
  type TamaguiEmptyStateProps,
} from './components/TamaguiEmptyState';
export {
  default as TamaguiErrorView,
  type TamaguiErrorViewProps,
} from './components/TamaguiErrorView';
export {
  default as TamaguiPlaceCardSkeleton,
  type TamaguiPlaceCardSkeletonProps,
} from './components/TamaguiPlaceCardSkeleton';
export {
  default as TamaguiListSkeleton,
  type TamaguiListSkeletonProps,
} from './components/TamaguiListSkeleton';
export {
  default as TamaguiRatingStars,
  type TamaguiRatingStarsProps,
} from './components/TamaguiRatingStars';

// Premium UI Components (Toss 2026)
export { TamaguiGlassCard, type TamaguiGlassCardProps } from './components/TamaguiGlassCard';
export {
  TamaguiFloatingCard,
  type TamaguiFloatingCardProps,
} from './components/TamaguiFloatingCard';
export {
  TamaguiSkeleton,
  TamaguiSkeletonGroup,
  type TamaguiSkeletonProps,
} from './components/TamaguiSkeleton';

// Micro-interaction Components
export {
  TamaguiPressableScale,
  type TamaguiPressableScaleProps,
} from './components/TamaguiPressableScale';
export {
  ConfettiOverlay,
  type ConfettiOverlayProps,
} from './components/ConfettiOverlay';

// Typography & Interactive Components
export { TamaguiChip, TamaguiChipGroup, type TamaguiChipProps } from './components/TamaguiChip';
export { TamaguiText, type TamaguiTextProps } from './components/TamaguiText';

// Button & Avatar Components
export {
  default as TamaguiButton,
  type TamaguiButtonProps,
  type ButtonVariant as TamaguiButtonVariant,
  type ButtonSize as TamaguiButtonSize,
} from './components/TamaguiButton';
export {
  TamaguiAvatar,
  type TamaguiAvatarProps,
  type AvatarSize as TamaguiAvatarSize,
} from './components/TamaguiAvatar';

// ═══════════════════════════════════════════════════════════
// Business Components (UJUz 2026)
// ═══════════════════════════════════════════════════════════

// Score & Admission
export { ScoreRing, type ScoreRingProps, type ScoreGrade } from './components/ScoreRing';

// Quota & Subscription
export { QuotaBar, type QuotaBarProps } from './components/QuotaBar';
export { PremiumGate, type PremiumGateProps } from './components/PremiumGate';

// Social Proof & Alerts
export { SocialProofBadge, type SocialProofBadgeProps } from './components/SocialProofBadge';
export { TOAlertBadge, type TOAlertBadgeProps } from './components/TOAlertBadge';

// Input & Header
export { TamaguiInput, type TamaguiInputProps } from './components/TamaguiInput';
export { TamaguiHeader, type TamaguiHeaderProps } from './components/TamaguiHeader';

// AI Components
export {
  ProactiveAICard,
  type ProactiveAICardProps,
  type AICardType,
} from './components/ProactiveAICard';

// Card Component (with glass/hero/locked variants)
export {
  default as TamaguiCard,
  type TamaguiCardProps,
  type CardVariant as TamaguiCardVariant,
} from './components/TamaguiCard';

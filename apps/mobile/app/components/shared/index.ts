/**
 * KidsMap Mobile - Shared Components
 */

export { default as ErrorView } from './ErrorView.ios26';
export { default as ErrorBoundary } from './ErrorBoundary';
export { RetryWrapper } from './RetryWrapper';

// Skeleton Loaders (iOS 26 Style with Shimmer)
export { default as Shimmer } from './Shimmer';
export { default as PlaceCardSkeleton } from './PlaceCardSkeleton';
export { default as SearchBarSkeleton } from './SearchBarSkeleton';
export { default as BottomSheetSkeleton } from './BottomSheetSkeleton';
export { default as ListSkeleton } from './ListSkeleton';

// Loading States (iOS 26 Style)
export { default as LoadingOverlay } from './LoadingOverlay';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as PullToRefresh } from './PullToRefresh';

// Error States (iOS 26 Style)
// ErrorView.ios26 is now the default ErrorView
export { default as NetworkError } from './NetworkError';
export { default as OfflineBanner } from './OfflineBanner';

// Animated Components (iOS 26 Style)
export { default as FadeIn } from './FadeIn';
export { default as SlideIn } from './SlideIn';
export { default as ScaleIn } from './ScaleIn';

// Shared UI Components
export { ActionButton } from './ActionButton';
export { Pill } from './Pill';
export { ReviewItem } from './ReviewItem';
export { ShortsGallery } from './ShortsGallery';
export { OptimizedImage } from './OptimizedImage';

// Tamagui Components (re-exported from design-system for backward compatibility)
export { TamaguiRatingStars, type TamaguiRatingStarsProps } from '@/app/design-system';

// Tamagui Loading & Error States (re-exported from design-system)
export { TamaguiLoading, type TamaguiLoadingProps } from '@/app/design-system';
export { TamaguiLoadingSpinner, type TamaguiLoadingSpinnerProps } from '@/app/design-system';
export { TamaguiEmptyState, type TamaguiEmptyStateProps } from '@/app/design-system';
export { TamaguiErrorView, type TamaguiErrorViewProps } from '@/app/design-system';

// Tamagui Skeleton Components (re-exported from design-system)
export { TamaguiPlaceCardSkeleton, type TamaguiPlaceCardSkeletonProps } from '@/app/design-system';
export { TamaguiListSkeleton, type TamaguiListSkeletonProps } from '@/app/design-system';

// Toast Notification System (토스 2026 스타일)
export { ToastProvider, useToast, type ToastConfig, type ToastType } from './Toast';

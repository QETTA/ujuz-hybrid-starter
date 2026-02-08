/**
 * TamaguiPlaceCardSkeleton - PlaceCard Skeleton 컴포넌트
 *
 * 2026 Design System: PlaceCard용 로딩 스켈레톤
 * - TamaguiSkeleton 기반
 * - Shimmer 애니메이션
 * - Light/Dark 모드 자동 지원
 */

import { XStack, YStack } from 'tamagui';
import { TamaguiSkeleton } from './TamaguiSkeleton';
import { TamaguiFloatingCard } from './TamaguiFloatingCard';

export interface TamaguiPlaceCardSkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

export function TamaguiPlaceCardSkeleton({ testID }: TamaguiPlaceCardSkeletonProps) {
  return (
    <TamaguiFloatingCard
      depth="raised"
      padding="sm"
      fullWidth
      testID={testID}
      accessibilityLabel="Loading place card"
    >
      <XStack gap="$3">
        {/* Image skeleton */}
        <TamaguiSkeleton variant="thumbnail" customWidth={120} customHeight={120} />

        {/* Content skeleton */}
        <YStack flex={1} justifyContent="space-between" paddingVertical="$1">
          {/* Title */}
          <TamaguiSkeleton variant="title" width="full" customWidth="80%" />

          {/* Rating */}
          <TamaguiSkeleton variant="text" customWidth="40%" />

          {/* Distance */}
          <TamaguiSkeleton variant="text" customWidth="30%" customHeight={14} />

          {/* Badges */}
          <XStack gap="$2">
            <TamaguiSkeleton variant="button" customWidth={60} customHeight={24} />
            <TamaguiSkeleton variant="button" customWidth={60} customHeight={24} />
          </XStack>
        </YStack>
      </XStack>
    </TamaguiFloatingCard>
  );
}

export default TamaguiPlaceCardSkeleton;

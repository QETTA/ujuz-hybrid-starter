/**
 * TamaguiListSkeleton - List Skeleton 컴포넌트
 *
 * 2026 Design System: 리스트용 로딩 스켈레톤
 * - 여러 PlaceCard 스켈레톤 반복
 * - Light/Dark 모드 자동 지원
 */

import React from 'react';
import { YStack } from 'tamagui';
import { TamaguiPlaceCardSkeleton } from './TamaguiPlaceCardSkeleton';

export interface TamaguiListSkeletonProps {
  /** Number of skeleton items */
  count?: number;
  /** Custom skeleton item component */
  ItemComponent?: React.ComponentType;
  /** Test ID for testing */
  testID?: string;
}

export function TamaguiListSkeleton({
  count = 5,
  ItemComponent,
  testID,
}: TamaguiListSkeletonProps) {
  const SkeletonItem = ItemComponent || TamaguiPlaceCardSkeleton;

  return (
    <YStack
      flex={1}
      gap="$3"
      paddingHorizontal="$4"
      testID={testID}
      accessibilityLabel="Loading list"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </YStack>
  );
}

export default TamaguiListSkeleton;

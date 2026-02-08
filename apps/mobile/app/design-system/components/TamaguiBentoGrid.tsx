/**
 * TamaguiBentoGrid - Bento Grid Layout 컴포넌트
 *
 * 2026 Design System: 불규칙 그리드 레이아웃
 * - 시각적 흥미를 유발하는 다양한 셀 크기
 * - 각 셀에 독립적 상호작용
 * - Responsive layout
 */

import React from 'react';
import { Dimensions } from 'react-native';
import { styled, YStack, XStack, GetProps } from 'tamagui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 16;
const AVAILABLE_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;
const CELL_WIDTH = (AVAILABLE_WIDTH - GRID_GAP) / 2;

// Bento Grid Container
export const TamaguiBentoGrid = styled(XStack, {
  name: 'BentoGrid',
  flexWrap: 'wrap',
  gap: '$3',
  padding: '$4',
  alignItems: 'flex-start',
});

// Bento Cell Base
const BentoCellBase = styled(YStack, {
  name: 'BentoCell',
  borderRadius: '$4',
  overflow: 'hidden',
  backgroundColor: '$surfaceElevated',

  // Shadow for depth
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,

  variants: {
    // Cell span types
    span: {
      // Single cell (1x1)
      1: {
        width: CELL_WIDTH,
        aspectRatio: 1,
      },
      // Double width (2x1)
      2: {
        width: AVAILABLE_WIDTH,
        aspectRatio: 2,
      },
      // Wide banner
      wide: {
        width: AVAILABLE_WIDTH,
        aspectRatio: 2.5,
      },
      // Tall cell (1x1.5)
      tall: {
        width: CELL_WIDTH,
        aspectRatio: 0.75,
      },
      // Hero cell (full width, taller)
      hero: {
        width: AVAILABLE_WIDTH,
        aspectRatio: 1.5,
      },
      // Compact cell
      compact: {
        width: CELL_WIDTH,
        aspectRatio: 1.2,
      },
      // Mini cell (smaller square)
      mini: {
        width: (AVAILABLE_WIDTH - GRID_GAP * 2) / 3,
        aspectRatio: 1,
      },
    },

    // Pressable
    pressable: {
      true: {
        pressStyle: {
          scale: 0.98,
          opacity: 0.9,
        },
      },
    },

    // Featured highlight
    featured: {
      true: {
        borderWidth: 2,
        borderColor: '$primary',
      },
    },
  } as const,

  defaultVariants: {
    span: 1,
  },
});

// Props types for BentoCell
export interface TamaguiBentoCellProps {
  /** Children content */
  children: React.ReactNode;
  /** Cell span type */
  span?: 1 | 2 | 'wide' | 'tall' | 'hero' | 'compact' | 'mini';
  /** Press handler */
  onPress?: () => void;
  /** Featured highlight */
  featured?: boolean;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export function TamaguiBentoCell({
  children,
  span = 1,
  onPress,
  featured,
  testID,
  accessibilityLabel,
}: TamaguiBentoCellProps) {
  const isPressable = !!onPress;

  return (
    <BentoCellBase
      span={span}
      pressable={isPressable}
      featured={featured}
      onPress={onPress}
      accessibilityRole={isPressable ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </BentoCellBase>
  );
}

// Props types for BentoGrid
export interface TamaguiBentoGridProps {
  /** Children (BentoCell components) */
  children: React.ReactNode;
  /** Test ID */
  testID?: string;
}

export function TamaguiBentoGridContainer({ children, testID }: TamaguiBentoGridProps) {
  return <TamaguiBentoGrid testID={testID}>{children}</TamaguiBentoGrid>;
}

// Type exports
export type { GetProps };

export default TamaguiBentoGrid;

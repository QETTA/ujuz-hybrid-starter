/**
 * TamaguiFloatingCard - Spatial Depth 컴포넌트
 *
 * 2026 Design System: Z축 인식 부유 카드
 * - Depth layers with progressive shadows
 * - Floating animation on press
 * - Light/Dark 모드 자동 지원
 */

import { styled, YStack, GetProps } from 'tamagui';
import * as Haptics from 'expo-haptics';

// Styled Floating Card
const FloatingCardBase = styled(YStack, {
  name: 'FloatingCard',
  backgroundColor: '$surfaceElevated',
  borderRadius: '$4',
  overflow: 'hidden',

  variants: {
    // Depth Levels
    depth: {
      flat: {
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      raised: {
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
      floating: {
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
      },
      elevated: {
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
      },
      lifted: {
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 16,
      },
    },

    // Padding
    padding: {
      none: { padding: 0 },
      sm: { padding: '$2' },
      md: { padding: '$4' },
      lg: { padding: '$6' },
    },

    // Border
    bordered: {
      true: {
        borderWidth: 1,
        borderColor: '$borderColor',
      },
    },

    // Pressable with depth change
    pressable: {
      true: {
        pressStyle: {
          scale: 0.98,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
      },
    },

    // Full width
    fullWidth: {
      true: {
        width: '100%',
      },
    },
  } as const,

  defaultVariants: {
    depth: 'raised',
    padding: 'md',
  },
});

// Props types
export interface TamaguiFloatingCardProps {
  /** Children content */
  children: React.ReactNode;
  /** Depth level */
  depth?: 'flat' | 'raised' | 'floating' | 'elevated' | 'lifted';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Show border */
  bordered?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Style override */
  style?: object;
}

export function TamaguiFloatingCard({
  children,
  depth = 'raised',
  padding = 'md',
  bordered,
  fullWidth,
  onPress,
  testID,
  accessibilityLabel,
  style,
}: TamaguiFloatingCardProps) {
  const isPressable = !!onPress;

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <FloatingCardBase
      depth={depth}
      padding={padding as any}
      bordered={bordered}
      fullWidth={fullWidth}
      pressable={isPressable}
      onPress={isPressable ? handlePress : undefined}
      accessibilityRole={isPressable ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      {children}
    </FloatingCardBase>
  );
}

// Type exports
export type { GetProps };

export default TamaguiFloatingCard;

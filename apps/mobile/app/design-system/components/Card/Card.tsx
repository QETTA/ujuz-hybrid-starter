import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  type ViewProps,
  type TouchableOpacityProps,
} from 'react-native';
import { Colors, Spacing, Shadows } from '../../tokens';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps extends ViewProps {
  /** 카드 변형 */
  variant?: CardVariant;
  /** 클릭 가능 여부 */
  onPress?: () => void;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 패딩 없음 */
  noPadding?: boolean;
  /** 접근성 라벨 */
  accessibilityLabel?: string;
  /** 접근성 힌트 */
  accessibilityHint?: string;
}

export default function Card({
  variant = 'elevated',
  onPress,
  children,
  noPadding = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: CardProps) {
  const baseStyle = [styles.base, styles[variant], !noPadding && styles.padding, style];

  if (onPress) {
    return (
      <TouchableOpacity
        {...(rest as TouchableOpacityProps)}
        style={baseStyle}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      {...rest}
      style={baseStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint || 'Card content'}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  padding: {
    padding: Spacing.md,
  },

  // Variants
  elevated: {
    backgroundColor: Colors.white,
    ...Shadows.md,
  },

  outlined: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.main,
  },

  filled: {
    backgroundColor: Colors.background.secondary,
  },
});

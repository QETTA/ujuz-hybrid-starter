import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Shadows, Spacing } from '../../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** 버튼 내용 */
  children: string;
  /** 버튼 변형 */
  variant?: ButtonVariant;
  /** 버튼 크기 */
  size?: ButtonSize;
  /** 로딩 상태 */
  loading?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 전체 너비 */
  fullWidth?: boolean;
  /** 아이콘 (왼쪽) */
  leftIcon?: React.ReactNode;
  /** 아이콘 (오른쪽) */
  rightIcon?: React.ReactNode;
  /** 클릭 이벤트 */
  onPress?: () => void;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      {...rest}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={loading ? 'Loading, please wait' : undefined}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary[500] : Colors.white}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
            {children}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    ...Shadows.sm,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary[500],
  },

  secondary: {
    backgroundColor: Colors.gray[600],
  },

  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary[500],
  },

  ghost: {
    backgroundColor: Colors.transparent,
  },

  danger: {
    backgroundColor: Colors.error.main,
  },

  // Sizes (iOS HIG: minimum 44pt touch target, sm uses 40pt with hitSlop)
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 40,
  },

  md: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
  },

  lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 2,
    minHeight: 52,
  },

  // Text Styles
  text: {
    ...Typography.button,
    textAlign: 'center',
  },

  smText: {
    ...Typography.buttonSmall,
  },

  mdText: {
    ...Typography.button,
  },

  lgText: {
    ...Typography.button,
    fontSize: 18,
  },

  // Text Colors
  primaryText: {
    color: Colors.white,
  },

  secondaryText: {
    color: Colors.white,
  },

  outlineText: {
    color: Colors.primary[500],
  },

  ghostText: {
    color: Colors.primary[500],
  },

  dangerText: {
    color: Colors.white,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  fullWidth: {
    width: '100%',
  },

  iconLeft: {
    marginRight: -Spacing.xs,
  },

  iconRight: {
    marginLeft: -Spacing.xs,
  },
});

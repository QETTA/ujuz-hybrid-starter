/**
 * HapticButton - iOS 28.2 Enhanced Button
 *
 * iOS 28.2 Features:
 * - Glow shadow on press (primary color)
 * - Spring physics (snappy preset)
 * - Scale 0.96 micro-interaction
 * - Enhanced haptic feedback
 * - Accessibility optimized
 */

import { useCallback } from 'react';
import { StyleSheet, ActivityIndicator, View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Animations, Depths, Glows } from '@/app/constants';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText } from '@/app/design-system';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type HapticStrength = 'light' | 'medium' | 'heavy';

interface HapticButtonProps {
  /** Button text */
  children: string;
  /** Press handler */
  onPress: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Haptic feedback strength */
  hapticStrength?: HapticStrength;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon (Ionicons name) */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon (Ionicons name) */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Enable glow effect on press */
  enableGlow?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const VARIANT_CONFIG = {
  primary: {
    background: Colors.link,
    backgroundPressed: Colors.primaryDark,
    text: Colors.white,
    border: undefined as string | undefined,
    glow: Glows.primary,
  },
  secondary: {
    background: Colors.iosTertiaryLabel,
    backgroundPressed: Colors.iosSecondaryLabel,
    text: Colors.white,
    border: undefined as string | undefined,
    glow: Glows.subtle,
  },
  outline: {
    background: 'transparent',
    backgroundPressed: Colors.iosSystemBlueAlpha10,
    text: Colors.link,
    border: Colors.link as string | undefined,
    glow: Glows.primary,
  },
  ghost: {
    background: 'transparent',
    backgroundPressed: Colors.overlayLight,
    text: Colors.link,
    border: undefined as string | undefined,
    glow: null,
  },
  danger: {
    background: Colors.iosSystemRed,
    backgroundPressed: Colors.error,
    text: Colors.white,
    border: undefined as string | undefined,
    glow: Glows.danger,
  },
};

const SIZE_CONFIG = {
  sm: {
    height: 44, // iOS HIG minimum touch target (was 36)
    paddingHorizontal: 16,
    fontSize: 14,
    iconSize: 16,
    borderRadius: 12,
  },
  md: {
    height: 48,
    paddingHorizontal: 20,
    fontSize: 16,
    iconSize: 20,
    borderRadius: 12,
  },
  lg: {
    height: 56,
    paddingHorizontal: 28,
    fontSize: 18,
    iconSize: 22,
    borderRadius: 14,
  },
} as const;

const HAPTIC_MAP = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function HapticButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  hapticStrength = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  enableGlow = true,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: HapticButtonProps) {
  // ─────────────────────────────────────────────────────────
  // ANIMATION VALUES
  // ─────────────────────────────────────────────────────────

  const pressed = useSharedValue(0);
  const scale = useSharedValue(1);

  // ─────────────────────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────────────────────

  const variantConfig = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  // ─────────────────────────────────────────────────────────
  // ANIMATED STYLES
  // ─────────────────────────────────────────────────────────

  const animatedContainerStyle = useAnimatedStyle(() => {
    const glowStyle =
      enableGlow && variantConfig.glow
        ? {
            shadowOpacity: pressed.value * variantConfig.glow.shadowOpacity,
            shadowRadius: pressed.value * variantConfig.glow.shadowRadius,
          }
        : {};

    return {
      transform: [{ scale: scale.value }],
      ...glowStyle,
    };
  });

  // ─────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, Animations.springSnappy);
    scale.value = withSpring(Animations.scale.pressIn, Animations.springButton);
  }, [pressed, scale]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, Animations.springSnappy);
    scale.value = withSpring(1, Animations.springButton);
  }, [pressed, scale]);

  const handlePress = useCallback(() => {
    if (isDisabled) return;

    // Haptic feedback
    Haptics.impactAsync(HAPTIC_MAP[hapticStrength]);

    // Execute callback
    onPress();
  }, [isDisabled, hapticStrength, onPress]);

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
    >
      {({ pressed: isPressed }) => (
        <Animated.View
          style={[
            styles.container,
            {
              height: sizeConfig.height,
              paddingHorizontal: sizeConfig.paddingHorizontal,
              borderRadius: sizeConfig.borderRadius,
              backgroundColor: isPressed
                ? variantConfig.backgroundPressed
                : variantConfig.background,
              borderWidth: variantConfig.border ? 1.5 : 0,
              borderColor: variantConfig.border || 'transparent',
              ...(enableGlow && variantConfig.glow
                ? { shadowColor: variantConfig.glow.shadowColor }
                : {}),
            },
            fullWidth && styles.fullWidth,
            isDisabled && styles.disabled,
            animatedContainerStyle,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={variantConfig.text} />
          ) : (
            <View style={styles.content}>
              {leftIcon && (
                <Ionicons
                  name={leftIcon}
                  size={sizeConfig.iconSize}
                  color={variantConfig.text}
                  style={styles.leftIcon}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
              )}
              <TamaguiText
                preset="body"
                weight="semibold"
                style={[
                  styles.text,
                  {
                    fontSize: sizeConfig.fontSize,
                    color: variantConfig.text,
                  },
                ]}
              >
                {children}
              </TamaguiText>
              {rightIcon && (
                <Ionicons
                  name={rightIcon}
                  size={sizeConfig.iconSize}
                  color={variantConfig.text}
                  style={styles.rightIcon}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
              )}
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // iOS 28.2 base shadow
    ...Depths.raised,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  leftIcon: {
    marginRight: 8,
  },

  rightIcon: {
    marginLeft: 8,
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },
});

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export { HapticButtonProps, ButtonVariant, ButtonSize, HapticStrength };

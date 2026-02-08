/**
 * FAB - Floating Action Button (iOS 28.2)
 *
 * iOS 28.2 Features:
 * - Lifted depth with primary glow shadow
 * - Spring physics on press (snappy)
 * - Auto-hide on scroll (optional)
 * - Haptic feedback
 * - Accessibility optimized
 */

import { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Animations } from '../../design-system/tokens/animations';
import { Depths, Glows } from '../../design-system/tokens/materials';
import { Colors } from '../../constants';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type FABPosition = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left';

type FABSize = 'sm' | 'md' | 'lg';

type FABVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

interface FABProps {
  /** Icon name (Ionicons) */
  icon: keyof typeof Ionicons.glyphMap;
  /** Press handler */
  onPress: () => void;
  /** Position on screen */
  position?: FABPosition;
  /** Button size */
  size?: FABSize;
  /** Color variant */
  variant?: FABVariant;
  /** Label for extended FAB (optional) */
  label?: string;
  /** Scroll offset to auto-hide (from useAnimatedScrollHandler) */
  scrollOffset?: SharedValue<number>;
  /** Hide threshold (pixels of scroll to start hiding) */
  hideThreshold?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility label */
  accessibilityLabel: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Custom style override */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const SIZE_CONFIG = {
  sm: { size: 48, iconSize: 22, borderRadius: 24 },
  md: { size: 56, iconSize: 26, borderRadius: 28 },
  lg: { size: 64, iconSize: 30, borderRadius: 32 },
} as const;

const VARIANT_CONFIG = {
  primary: {
    backgroundColor: Colors.iosSystemBlue,
    iconColor: Colors.white,
    glow: Glows.primary,
  },
  secondary: {
    backgroundColor: Colors.iosTertiaryLabel,
    iconColor: Colors.white,
    glow: Glows.subtle,
  },
  success: {
    backgroundColor: Colors.iosSystemGreen,
    iconColor: Colors.white,
    glow: Glows.success,
  },
  warning: {
    backgroundColor: Colors.iosSystemOrange,
    iconColor: Colors.white,
    glow: Glows.warning,
  },
  danger: {
    backgroundColor: Colors.iosSystemRed,
    iconColor: Colors.white,
    glow: Glows.danger,
  },
} as const;

const POSITION_STYLES: Record<FABPosition, ViewStyle> = {
  'bottom-right': { bottom: 24, right: 20 },
  'bottom-left': { bottom: 24, left: 20 },
  'bottom-center': { bottom: 24, left: '50%', marginLeft: -28 },
  'top-right': { top: 100, right: 20 },
  'top-left': { top: 100, left: 20 },
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function FAB({
  icon,
  onPress,
  position = 'bottom-right',
  size = 'md',
  variant = 'primary',
  label: _label, // Reserved for extended FAB
  scrollOffset,
  hideThreshold = 50,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: FABProps) {
  // ─────────────────────────────────────────────────────────
  // ANIMATION VALUES
  // ─────────────────────────────────────────────────────────

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  // opacity reserved for future use

  // ─────────────────────────────────────────────────────────
  // AUTO-HIDE ON SCROLL
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!scrollOffset) return;

    // Subscribe to scroll offset changes
    // Note: This is a simplified version. In production, use
    // useAnimatedReaction for smoother performance
  }, [scrollOffset]);

  // ─────────────────────────────────────────────────────────
  // ANIMATED STYLES
  // ─────────────────────────────────────────────────────────

  const animatedStyle = useAnimatedStyle(() => {
    // Auto-hide based on scroll offset
    const scrollY = scrollOffset?.value ?? 0;
    const hideProgress = interpolate(
      scrollY,
      [0, hideThreshold, hideThreshold + 50],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value + hideProgress * 100 }],
      opacity: interpolate(hideProgress, [0, 0.5, 1], [1, 1, 0]),
    };
  });

  // ─────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────

  const handlePressIn = () => {
    scale.value = withSpring(Animations.scale.pressIn, Animations.springSnappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animations.springSnappy);
  };

  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Execute callback
    onPress();
  };

  // ─────────────────────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────────────────────

  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = VARIANT_CONFIG[variant];

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <AnimatedTouchable
      style={[
        styles.fab,
        {
          width: sizeConfig.size,
          height: sizeConfig.size,
          borderRadius: sizeConfig.borderRadius,
          backgroundColor: variantConfig.backgroundColor,
          ...variantConfig.glow,
        },
        POSITION_STYLES[position],
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <Ionicons
        name={icon}
        size={sizeConfig.iconSize}
        color={variantConfig.iconColor}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      />
    </AnimatedTouchable>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    // iOS 28.2 lifted depth (base, enhanced by glow)
    ...Depths.lifted,
  },

  disabled: {
    opacity: 0.5,
  },

  // Extended FAB with label
  extended: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    width: 'auto',
    gap: 8,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: -0.2,
  },
});

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export { FABProps, FABPosition, FABSize, FABVariant };

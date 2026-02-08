/**
 * TamaguiGlassCard - Glassmorphism 2.0 컴포넌트
 *
 * 2026 Design System: 다층 글래스 효과
 * - backdrop-blur + 반투명 배경
 * - Light reflection 효과 (React Native LinearGradient)
 * - Light/Dark 모드 자동 지원
 */

import { StyleSheet, View } from 'react-native';
import { styled, YStack, GetProps, useTheme } from 'tamagui';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Base Glass Container
const GlassContainer = styled(YStack, {
  name: 'GlassCard',
  borderRadius: '$4',
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '$glassDark',

  variants: {
    // Glass Intensity
    intensity: {
      light: {
        backgroundColor: '$glassDark',
      },
      medium: {
        backgroundColor: '$glassMedium',
      },
      heavy: {
        backgroundColor: '$glassLight',
      },
    },

    // Padding variants
    padding: {
      none: { padding: 0 },
      sm: { padding: '$2' },
      md: { padding: '$4' },
      lg: { padding: '$6' },
    },

    // Glow effect
    glow: {
      true: {
        shadowColor: '$primary',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      primary: {
        shadowColor: '$primary',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      success: {
        shadowColor: '$success',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      warning: {
        shadowColor: '$warning',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      error: {
        shadowColor: '$error',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
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
  } as const,

  defaultVariants: {
    intensity: 'medium',
    padding: 'md',
  },
});

// Props types
export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/** Theme token keys for score glow (resolved via useTheme) */
const SCORE_GLOW_KEYS: Record<ScoreGrade, string> = {
  A: 'scoreA',
  B: 'scoreB',
  C: 'scoreC',
  D: 'scoreD',
  F: 'scoreF',
};

export interface TamaguiGlassCardProps {
  /** Children content */
  children: React.ReactNode;
  /** Glass intensity */
  intensity?: 'light' | 'medium' | 'heavy';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Glow effect */
  glow?: boolean | 'primary' | 'success' | 'warning' | 'error';
  /** Score grade glow — overrides glow with grade-specific color */
  scoreGlow?: ScoreGrade;
  /** Blur intensity (0-100) */
  blurIntensity?: number;
  /** Press handler */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Style override */
  style?: object;
}

export function TamaguiGlassCard({
  children,
  intensity = 'medium',
  padding = 'md',
  glow,
  scoreGlow,
  blurIntensity = 60,
  onPress,
  testID,
  accessibilityLabel,
  style,
}: TamaguiGlassCardProps) {
  const theme = useTheme();
  const isPressable = !!onPress;

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Determine blur tint based on theme (light bg → light tint, dark bg → dark)
  const blurTint = theme.background.val === '#ffffff' || theme.background.val === '#FFFFFF'
    ? 'light'
    : 'dark';

  // Glass reflection: theme-aware white-to-transparent gradient
  const reflectionColors = [
    theme.glassLight.val,
    `${theme.glassLight.val}00`,
  ] as [string, string];

  // Get glow value for variant
  const glowValue = glow === true ? 'true' : glow || undefined;

  // Score glow overrides standard glow with grade-specific shadow
  const scoreGlowStyle = scoreGlow
    ? {
        shadowColor: (theme as any)[SCORE_GLOW_KEYS[scoreGlow]]?.val ?? theme.primary.val,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      }
    : undefined;

  return (
    <BlurView intensity={blurIntensity} tint={blurTint} style={[styles.blurContainer, style]}>
      <GlassContainer
        intensity={intensity}
        padding={padding as any}
        glow={scoreGlow ? undefined : (glowValue as any)}
        pressable={isPressable}
        onPress={isPressable ? handlePress : undefined}
        accessibilityRole={isPressable ? 'button' : undefined}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        {...(scoreGlowStyle as any)}
      >
        {/* Light reflection overlay - React Native LinearGradient */}
        <View style={styles.reflectionContainer} pointerEvents="none">
          <LinearGradient
            colors={reflectionColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.reflectionGradient}
          />
        </View>
        {children}
      </GlassContainer>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  reflectionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  reflectionGradient: {
    flex: 1,
  },
});

// Type exports
export type { GetProps };

export default TamaguiGlassCard;

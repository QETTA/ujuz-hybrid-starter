/**
 * GradientScaffold - 2026 Design System Screen Wrapper
 *
 * Replaces flat white/dark backgrounds with subtle themed gradients.
 * Glass cards become visible when placed on gradient backgrounds.
 */
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type GradientVariant = 'subtle' | 'warm' | 'cool' | 'premium' | 'brand';

interface GradientScaffoldProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  /** Add safe area padding at top */
  safeTop?: boolean;
  /** Add safe area padding at bottom */
  safeBottom?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function GradientScaffold({
  children,
  variant = 'subtle',
  safeTop = false,
  safeBottom = false,
  style,
  testID,
}: GradientScaffoldProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const gradientColors = getGradientColors(variant, theme);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        safeTop && { paddingTop: insets.top },
        safeBottom && { paddingBottom: insets.bottom },
        style,
      ]}
      testID={testID}
    >
      {children}
    </LinearGradient>
  );
}

function getGradientColors(variant: GradientVariant, theme: any): [string, string, string] {
  const bg = theme.background.val;
  const primary = theme.primary.val;

  switch (variant) {
    case 'subtle':
      // Very subtle primary tint - default for most screens
      return [bg, `${primary}06`, bg];
    case 'warm':
      // Warm tint for engagement screens
      return [bg, `${primary}0A`, `${theme.warning?.val || '#f59e0b'}05`];
    case 'cool':
      // Cool blue tint for info/map screens
      return [bg, `${theme.info?.val || '#0EA5E9'}06`, bg];
    case 'premium':
      // Purple tint for premium/subscription screens
      return [`${theme.premium?.val || '#a855f7'}04`, bg, `${theme.premium?.val || '#a855f7'}06`];
    case 'brand':
      // Strong brand gradient for hero screens
      return [bg, `${primary}0C`, `${primary}04`];
    default:
      return [bg, `${primary}06`, bg];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientScaffold;

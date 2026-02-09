/**
 * Shimmer Effect Component - iOS 26 Style
 *
 * Animated shimmer effect for skeleton loaders
 * Dark/Light mode aware
 */

import { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/app/constants/Colors';

interface ShimmerProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Shimmer({ width, height, borderRadius = 8, style }: ShimmerProps) {
  const translateX = useSharedValue(-1);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    translateX.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, []);

  const shimmerColor = isDark ? Colors.whiteAlpha30 : 'rgba(0, 0, 0, 0.06)';
  const containerBg = isDark ? Colors.darkSurfaceElevated : Colors.iosSecondaryBackground;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-1, 1],
            [typeof width === 'number' ? -width : -200, typeof width === 'number' ? width : 200]
          ),
        },
      ],
    };
  });

  return (
    <View style={[styles.container, { width, height, borderRadius, backgroundColor: containerBg }, style]}>
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
});

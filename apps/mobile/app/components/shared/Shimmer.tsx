/**
 * Shimmer Effect Component - iOS 26 Style
 *
 * Animated shimmer effect for skeleton loaders
 */

import { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
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

  useEffect(() => {
    translateX.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, []);

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
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={['transparent', Colors.whiteAlpha30, 'transparent']}
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
    backgroundColor: Colors.iosSecondaryBackground,
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

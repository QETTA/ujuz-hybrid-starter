/**
 * LikeAnimation Component
 *
 * Animated heart that appears on double-tap like
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants/Colors';

interface LikeAnimationProps {
  show: boolean;
  onComplete: () => void;
}

export function LikeAnimation({ show, onComplete }: LikeAnimationProps) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      scale.setValue(0);
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          delay: 500,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onComplete());
    }
  }, [show, scale, onComplete]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale }],
          opacity: scale,
        },
      ]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name="heart" size={120} color={Colors.iosSystemRed} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});

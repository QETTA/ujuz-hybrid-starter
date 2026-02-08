/**
 * ScaleIn - Animated Component
 *
 * Scale in animation wrapper with optional bounce
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { AnimationConfig } from '@/app/utils/animations';

interface ScaleInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  bounce?: boolean;
  style?: ViewStyle;
}

export default function ScaleIn({
  children,
  duration = AnimationConfig.duration.fast,
  delay = 0,
  bounce = false,
  style,
}: ScaleInProps) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration,
      delay,
      easing: bounce ? AnimationConfig.easing.bounce : AnimationConfig.easing.sharp,
      useNativeDriver: true,
    }).start();
  }, [scale, duration, delay, bounce]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

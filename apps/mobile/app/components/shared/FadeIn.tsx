/**
 * FadeIn - Animated Component
 *
 * Fade in animation wrapper for any component
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { AnimationConfig } from '@/app/utils/animations';

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export default function FadeIn({
  children,
  duration = AnimationConfig.duration.normal,
  delay = 0,
  style,
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: AnimationConfig.easing.decelerate,
      useNativeDriver: true,
    }).start();
  }, [opacity, duration, delay]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

/**
 * SlideIn - Animated Component
 *
 * Slide in animation wrapper from different directions
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, Dimensions } from 'react-native';
import { AnimationConfig } from '@/app/utils/animations';

const { height, width } = Dimensions.get('window');

interface SlideInProps {
  children: React.ReactNode;
  from?: 'left' | 'right' | 'top' | 'bottom';
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export default function SlideIn({
  children,
  from = 'bottom',
  duration = AnimationConfig.duration.normal,
  delay = 0,
  style,
}: SlideInProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set initial position based on direction
    let initialX = 0;
    let initialY = 0;

    switch (from) {
      case 'left':
        initialX = -width;
        break;
      case 'right':
        initialX = width;
        break;
      case 'top':
        initialY = -height;
        break;
      case 'bottom':
        initialY = height / 4; // Slide from quarter screen for subtle effect
        break;
    }

    translateX.setValue(initialX);
    translateY.setValue(initialY);

    // Animate to final position
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        easing: AnimationConfig.easing.standard,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: AnimationConfig.easing.standard,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateX, translateY, from, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

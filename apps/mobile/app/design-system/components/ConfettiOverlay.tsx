/**
 * ConfettiOverlay - 목표 달성 축하 컨페티
 *
 * 순수 Reanimated 기반, 외부 패키지 불필요
 * 공동구매 목표 달성 시 트리거
 *
 * Phase 10.2: 마이크로 인터랙션
 */

import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#5DDB9E', // mint (brand)
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#22d3ee', // cyan
  '#ef4444', // red
  '#10b981', // emerald
];

const PARTICLE_COUNT = 36;
const DURATION = 2800;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  drift: number;
  rotation: number;
  shape: 'square' | 'rect';
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_W,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 6,
    delay: Math.random() * 400,
    drift: (Math.random() - 0.5) * 80,
    rotation: Math.random() * 360,
    shape: Math.random() > 0.5 ? 'square' : 'rect',
  }));
}

function ConfettiParticle({ particle }: { particle: Particle }) {
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.value = withDelay(
      particle.delay,
      withTiming(1, {
        duration: DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const progress = fall.value;
    return {
      transform: [
        { translateY: -40 + progress * (SCREEN_H + 80) },
        { translateX: particle.drift * progress },
        { rotate: `${particle.rotation + progress * 720}deg` },
      ],
      opacity: progress < 0.1 ? progress * 10 : progress > 0.75 ? (1 - progress) * 4 : 1,
    };
  });

  const w = particle.shape === 'rect' ? particle.size * 1.8 : particle.size;
  const h = particle.size;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: particle.x,
          width: w,
          height: h,
          borderRadius: 2,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

export interface ConfettiOverlayProps {
  /** Show/trigger confetti */
  visible: boolean;
  /** Callback when confetti finishes */
  onFinish?: () => void;
}

export function ConfettiOverlay({ visible, onFinish }: ConfettiOverlayProps) {
  const particles = useMemo(() => (visible ? generateParticles() : []), [visible]);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(() => {
        onFinish?.();
      }, DURATION + 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, onFinish]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} particle={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default ConfettiOverlay;

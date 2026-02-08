/**
 * ScoreRing - 원형 프로그레스 + 등급 표시
 *
 * 입학 가능성 점수를 시각적 원형 프로그레스로 표시
 * A~F 등급별 컬러 코딩
 *
 * Phase 10.2: withSpring 물리 애니메이션 + 카운트업 + 햅틱
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { YStack, Text, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/** Grade colors mapped to tamagui theme tokens (ujuzColors.score*) */
const GRADE_TOKEN: Record<ScoreGrade, string> = {
  A: '$scoreA',
  B: '$scoreB',
  C: '$scoreC',
  D: '$scoreD',
  F: '$scoreF',
};

const GRADE_LABELS: Record<ScoreGrade, string> = {
  A: '매우 높음',
  B: '높음',
  C: '보통',
  D: '낮음',
  F: '매우 낮음',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ScoreRingProps {
  /** Score percentage (0-100) */
  score: number;
  /** Grade letter */
  grade: ScoreGrade;
  /** Ring size */
  size?: 'sm' | 'md' | 'lg';
  /** Show label below grade */
  showLabel?: boolean;
}

const SIZE_CONFIG = {
  sm: { diameter: 80, strokeWidth: 6, fontSize: 20, gradeSize: 14 },
  md: { diameter: 140, strokeWidth: 8, fontSize: 32, gradeSize: 18 },
  lg: { diameter: 200, strokeWidth: 10, fontSize: 44, gradeSize: 24 },
};

export function ScoreRing({
  score,
  grade,
  size = 'md',
  showLabel = true,
}: ScoreRingProps) {
  const theme = useTheme();
  const config = SIZE_CONFIG[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Resolve grade color from theme token
  const gradeThemeKey = GRADE_TOKEN[grade].slice(1); // remove '$'
  const color = (theme as any)[gradeThemeKey]?.val ?? theme.primary.val;

  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  // Count-up: sync animated progress → display number
  useAnimatedReaction(
    () => Math.round(progress.value * score),
    (current, prev) => {
      if (current !== prev) {
        runOnJS(setDisplayScore)(current);
      }
    },
    [score],
  );

  useEffect(() => {
    progress.value = withSpring(1, {
      damping: 18,
      stiffness: 80,
      mass: 1,
    });
  }, [score]);

  // Haptic on ring completion
  useAnimatedReaction(
    () => progress.value,
    (current, prev) => {
      if (prev !== null && prev < 0.95 && current >= 0.95) {
        runOnJS(Haptics.notificationAsync)(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    },
    [score],
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value * (score / 100)),
  }));

  return (
    <YStack alignItems="center" gap="$2">
      <View style={{ width: config.diameter, height: config.diameter }}>
        <Svg width={config.diameter} height={config.diameter}>
          {/* Background ring */}
          <Circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            stroke={theme.borderColor.val}
            strokeWidth={config.strokeWidth}
            fill="transparent"
            opacity={0.3}
          />
          {/* Animated progress ring */}
          <AnimatedCircle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            stroke={color}
            strokeWidth={config.strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${config.diameter / 2}, ${config.diameter / 2}`}
          />
        </Svg>
        {/* Center content — count-up number */}
        <View style={[styles.centerContent, { width: config.diameter, height: config.diameter }]}>
          <Text
            fontSize={config.fontSize}
            fontWeight="700"
            color={color}
          >
            {displayScore}%
          </Text>
          <Text
            fontSize={config.gradeSize}
            fontWeight="600"
            color={color}
            marginTop={-2}
          >
            {grade}등급
          </Text>
        </View>
      </View>
      {showLabel && (
        <Text fontSize={14} color="$textSecondary" fontWeight="500">
          {GRADE_LABELS[grade]}
        </Text>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScoreRing;

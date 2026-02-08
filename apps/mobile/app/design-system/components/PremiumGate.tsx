/**
 * PremiumGate - 소프트 페이월 오버레이
 *
 * Feature-Gated Soft Paywall:
 * 기능 화면이 블러 처리 + 오버레이
 * "Premium으로 잠금 해제" + 혜택 3줄 + CTA
 */

import { StyleSheet, View } from 'react-native';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import TamaguiButton from './TamaguiButton';

export interface PremiumGateProps {
  /** Whether to show the gate */
  visible: boolean;
  /** Feature name being gated */
  featureName?: string;
  /** Benefits to display */
  benefits?: string[];
  /** CTA button text */
  ctaText?: string;
  /** CTA press handler */
  onUpgradePress?: () => void;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Children (content to blur behind the gate) */
  children: React.ReactNode;
  /** Inline mode (no absolute overlay) */
  inline?: boolean;
}

const DEFAULT_BENEFITS = [
  '무제한 입학 가능성 조회',
  '실시간 TO(빈자리) 알림',
  '우주봇 AI 무제한 상담',
];

export function PremiumGate({
  visible,
  featureName = '이 기능',
  benefits = DEFAULT_BENEFITS,
  ctaText = 'Premium으로 잠금 해제',
  onUpgradePress,
  onDismiss,
  children,
  inline = false,
}: PremiumGateProps) {
  if (!visible) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <YStack
          backgroundColor="$surfaceMuted"
          borderRadius={16}
          padding="$4"
          alignItems="center"
          gap="$3"
          borderWidth={1}
          borderColor="$premium"
        >
          <GateContent
            featureName={featureName}
            benefits={benefits}
            ctaText={ctaText}
            onUpgradePress={onUpgradePress}
          />
        </YStack>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      {children}
      <Animated.View entering={FadeIn.duration(400)} style={StyleSheet.absoluteFill}>
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.overlay}>
          <Animated.View entering={SlideInDown.delay(200).springify()}>
            <YStack
              backgroundColor="$card"
              borderRadius={24}
              padding="$6"
              marginHorizontal="$4"
              alignItems="center"
              gap="$4"
              shadowColor="$premium"
              shadowOffset={{ width: 0, height: 8 }}
              shadowOpacity={0.2}
              shadowRadius={24}
              elevation={8}
            >
              <GateContent
                featureName={featureName}
                benefits={benefits}
                ctaText={ctaText}
                onUpgradePress={onUpgradePress}
              />
              {onDismiss && (
                <Text
                  fontSize={14}
                  color="$textTertiary"
                  onPress={onDismiss}
                  pressStyle={{ opacity: 0.7 }}
                >
                  나중에 하기
                </Text>
              )}
            </YStack>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

function GateContent({
  featureName,
  benefits,
  ctaText,
  onUpgradePress,
}: {
  featureName: string;
  benefits: string[];
  ctaText: string;
  onUpgradePress?: () => void;
}) {
  const theme = useTheme();
  const premiumColor = theme.premium.val;

  return (
    <>
      <View style={[styles.lockIcon, { backgroundColor: `${premiumColor}1F` }]}>
        <Ionicons name="lock-closed" size={32} color={premiumColor} />
      </View>
      <Text fontSize={18} fontWeight="700" color="$textPrimary" textAlign="center">
        {featureName}은{'\n'}Premium에서 이용 가능해요
      </Text>
      <YStack gap="$2" width="100%">
        {benefits.map((benefit, i) => (
          <XStack key={i} alignItems="center" gap="$2">
            <Ionicons name="checkmark-circle" size={18} color={premiumColor} />
            <Text fontSize={14} color="$textSecondary">
              {benefit}
            </Text>
          </XStack>
        ))}
      </YStack>
      <TamaguiButton
        variant="premium"
        size="lg"
        fullWidth
        onPress={onUpgradePress}
        leftIcon={<Ionicons name="diamond" size={18} color={theme.textInverse.val} />}
      >
        {ctaText}
      </TamaguiButton>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PremiumGate;

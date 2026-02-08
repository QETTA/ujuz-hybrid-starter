/**
 * ProactiveAICard - 우주봇 제안 카드
 *
 * AI가 컨텍스트 기반으로 먼저 제안하는 카드
 * 홈, 지도, 시설 상세 등에서 사용
 */

import { StyleSheet, View } from 'react-native';
import { XStack, YStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TamaguiGlassCard } from './TamaguiGlassCard';

export type AICardType = 'to_alert' | 'recommendation' | 'insight' | 'deal' | 'tip';

/** Theme token keys for each AI card type */
const CARD_ICONS: Record<AICardType, { name: string; themeKey: string }> = {
  to_alert: { name: 'notifications', themeKey: 'success' },
  recommendation: { name: 'compass', themeKey: 'primary' },
  insight: { name: 'bulb', themeKey: 'warning' },
  deal: { name: 'pricetag', themeKey: 'deal' },
  tip: { name: 'sparkles', themeKey: 'scoreB' },
};

export interface ProactiveAICardProps {
  /** Card type determines icon and color */
  type: AICardType;
  /** Main message from AI */
  message: string;
  /** CTA button text */
  ctaText?: string;
  /** CTA press handler */
  onCtaPress?: () => void;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Sub-info text */
  subInfo?: string;
}

export function ProactiveAICard({
  type,
  message,
  ctaText = '자세히 보기',
  onCtaPress,
  onDismiss,
  subInfo,
}: ProactiveAICardProps) {
  const theme = useTheme();
  const iconCfg = CARD_ICONS[type];
  const iconColor = (theme as any)[iconCfg.themeKey]?.val ?? theme.primary.val;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCtaPress?.();
  };

  return (
    <TamaguiGlassCard
      intensity="medium"
      padding="md"
      onPress={handlePress}
      accessibilityLabel={`AI 제안: ${message}`}
    >
      <XStack gap="$3" alignItems="flex-start">
        {/* AI Avatar */}
        <View style={[styles.aiAvatar, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconCfg.name as any} size={20} color={iconColor} />
        </View>

        {/* Content */}
        <YStack flex={1} gap="$1">
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$1">
              <Text fontSize={12} fontWeight="600" color="$primary">
                우주봇
              </Text>
              <View style={[styles.aiBadge, { backgroundColor: `${theme.primary.val}25` }]}>
                <Text fontSize={9} fontWeight="700" color="$primary">
                  AI
                </Text>
              </View>
            </XStack>
            {onDismiss && (
              <Ionicons
                name="close"
                size={16}
                color={theme.textTertiary.val}
                onPress={onDismiss}
              />
            )}
          </XStack>

          <Text fontSize={14} fontWeight="500" color="$textPrimary" lineHeight={20}>
            {message}
          </Text>

          {subInfo && (
            <Text fontSize={12} color="$textTertiary">
              {subInfo}
            </Text>
          )}

          <XStack marginTop="$1">
            <Text
              fontSize={13}
              fontWeight="600"
              color="$primary"
              pressStyle={{ opacity: 0.7 }}
              onPress={handlePress}
            >
              {ctaText} →
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </TamaguiGlassCard>
  );
}

const styles = StyleSheet.create({
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
});

export default ProactiveAICard;

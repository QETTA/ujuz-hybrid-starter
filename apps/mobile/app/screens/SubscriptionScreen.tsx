/**
 * SubscriptionScreen - 구독 관리
 *
 * 2026 Design Language:
 * - LinearGradient background (brandSplashGradient)
 * - Monochrome gray scale, tight letterSpacing, variable weight
 * - All Korean text except "Ujuz" brand
 * - No emojis, no artificial icons
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { RootStackNavigationProp } from '@/app/types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, YStack, XStack, Text } from 'tamagui';

import { Colors, Layout } from '@/app/constants';
import { TamaguiPressableScale, QuotaBar, SocialProofBadge } from '@/app/design-system';
import { usePayment } from '@/app/hooks/usePayment';
import { PLAN_LIMITS } from '@/app/types/subscription';
import type { PlanTier, SubscriptionPlan } from '@/app/types/subscription';

// ── Animation ──

const stagger = (i: number) =>
  FadeInDown.delay(i * Layout.stagger.delay)
    .springify()
    .damping(Layout.stagger.damping)
    .stiffness(110)
    .mass(0.7);

// ── Constants ──

const TIER_NAMES: Record<PlanTier, string> = {
  free: '무료',
  basic: '베이직',
  premium: '프리미엄',
};

const TIER_ICONS = {
  free: 'leaf-outline',
  basic: 'star-outline',
  premium: 'diamond-outline',
} as const;

const TIER_PRICES: Record<PlanTier, string> = {
  free: '무료',
  basic: '9,900',
  premium: '19,900',
};

interface UsageItem {
  label: string;
  usedKey: 'admission_scores_used' | 'to_alerts_active' | 'bot_queries_today';
  limitKey: 'admission_score_limit' | 'to_alert_facility_limit' | 'bot_query_daily_limit';
}

const USAGE_ITEMS: UsageItem[] = [
  {
    label: '입학 가능성 분석',
    usedKey: 'admission_scores_used',
    limitKey: 'admission_score_limit',
  },
  { label: '빈자리 알림', usedKey: 'to_alerts_active', limitKey: 'to_alert_facility_limit' },
  { label: '우주봇', usedKey: 'bot_queries_today', limitKey: 'bot_query_daily_limit' },
];

interface ComparisonRow {
  label: string;
  free: string;
  basic: string;
  premium: string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: '입학 가능성 분석', free: '1회/월', basic: '5회/월', premium: '무제한' },
  { label: '빈자리 알림', free: '1시설', basic: '5시설', premium: '무제한' },
  { label: '우주봇', free: '5회/일', basic: '30회/일', premium: '무제한' },
  { label: '광고 제거', free: '-', basic: 'O', premium: 'O' },
];

const TIERS: PlanTier[] = ['free', 'basic', 'premium'];

// ── Helpers ──

function getRemainingDays(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Sub-Components ──

function PlanColumn({
  tier,
  isCurrentTier,
  plan,
  onUpgrade,
}: {
  tier: PlanTier;
  isCurrentTier: boolean;
  plan: SubscriptionPlan | undefined;
  onUpgrade: (planId: string) => void;
}) {
  const theme = useTheme();
  const isPremium = tier === 'premium';

  const iconColor = isCurrentTier
    ? theme.textInverse.val
    : tier === 'free'
      ? theme.textTertiary.val
      : theme.textPrimary.val;

  return (
    <YStack
      backgroundColor={isCurrentTier ? '$surfaceElevated' : '$surface'}
      borderRadius={14}
      padding={20}
      borderWidth={isPremium || isCurrentTier ? 1.5 : 0.5}
      borderColor={
        isPremium
          ? '$premium'
          : isCurrentTier
            ? '$primary'
            : '$borderColor'
      }
      {...(isPremium && {
        shadowColor: '$premium',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      })}
    >
      {/* Plan Header */}
      <XStack alignItems="flex-start" gap="$3">
        <YStack
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor="$surfaceElevated"
          alignItems="center"
          justifyContent="center"
          marginTop={2}
        >
          <Ionicons name={TIER_ICONS[tier]} size={18} color={iconColor} />
        </YStack>
        <YStack flex={1}>
          <XStack alignItems="center" gap="$2">
            <Text
              fontSize={18}
              fontWeight="700"
              color={isCurrentTier ? '$textInverse' : '$color'}
              letterSpacing={-0.5}
            >
              {TIER_NAMES[tier]}
            </Text>
            {isCurrentTier && (
              <YStack
                paddingHorizontal={6}
                paddingVertical={2}
                borderRadius={4}
                backgroundColor="$glassDark"
              >
                <Text fontSize={10} fontWeight="700" color="$textInverse" letterSpacing={0.3}>
                  현재
                </Text>
              </YStack>
            )}
            {isPremium && !isCurrentTier && (
              <YStack
                paddingHorizontal={6}
                paddingVertical={2}
                borderRadius={4}
                backgroundColor="$premium"
              >
                <Text fontSize={10} fontWeight="700" color="$textInverse" letterSpacing={0.3}>
                  추천 🏆
                </Text>
              </YStack>
            )}
          </XStack>
          {tier === 'free' ? (
            <Text
              fontSize={13}
              fontWeight="400"
              color={isCurrentTier ? '$glassLight' : '$textTertiary'}
              letterSpacing={-0.2}
              marginTop={2}
            >
              무료
            </Text>
          ) : (
            <XStack alignItems="baseline" marginTop={2}>
              <Text
                fontSize={13}
                fontWeight="400"
                color={isCurrentTier ? '$glassLight' : '$textTertiary'}
                letterSpacing={-0.2}
              >
                월{' '}
              </Text>
              <Text
                fontSize={22}
                fontWeight="200"
                color={isCurrentTier ? '$textInverse' : '$color'}
                letterSpacing={-1}
              >
                {TIER_PRICES[tier]}
              </Text>
              <Text
                fontSize={13}
                fontWeight="400"
                color={isCurrentTier ? '$glassLight' : '$textTertiary'}
                letterSpacing={-0.2}
              >
                원
              </Text>
            </XStack>
          )}
        </YStack>
      </XStack>

      <YStack
        height={0.5}
        backgroundColor={isCurrentTier ? '$glassDark' : '$borderColor'}
        marginVertical={16}
      />

      {/* Feature List */}
      {COMPARISON_ROWS.map((row) => {
        const isDisabled = row[tier] === '-';
        const featureIconColor = isCurrentTier
          ? isDisabled
            ? theme.glassDark.val
            : theme.textInverse.val
          : isDisabled
            ? theme.textTertiary.val
            : theme.color.val;

        return (
          <XStack
            key={row.label}
            justifyContent="space-between"
            alignItems="center"
            paddingVertical={6}
          >
            <XStack alignItems="center">
              <Ionicons
                name={isDisabled ? 'close-circle-outline' : 'checkmark-circle'}
                size={16}
                color={featureIconColor}
              />
              <Text
                fontSize={13}
                fontWeight="500"
                color={isCurrentTier ? '$glassLight' : '$textSecondary'}
                letterSpacing={-0.2}
                marginLeft={8}
              >
                {row.label}
              </Text>
            </XStack>
            <Text
              fontSize={13}
              fontWeight="600"
              color={
                isCurrentTier
                  ? '$textInverse'
                  : row[tier] === '무제한'
                    ? '$color'
                    : '$textSecondary'
              }
              letterSpacing={-0.2}
            >
              {row[tier]}
            </Text>
          </XStack>
        );
      })}

      {/* CTA */}
      {!isCurrentTier && tier !== 'free' && (
        <TamaguiPressableScale
          style={{
            backgroundColor: theme.primary.val,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            marginTop: 16,
          }}
          onPress={() => onUpgrade(plan?.id ?? tier)}
          hapticType="medium"
        >
          <Text fontSize={14} fontWeight="600" color="$background" letterSpacing={-0.2}>
            {isPremium ? '프리미엄 시작하기' : '업그레이드'}
          </Text>
        </TamaguiPressableScale>
      )}
    </YStack>
  );
}

// ── Main Screen ──

export function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useTheme();

  const { subscription, currentTier, fetchSubscription, fetchPlans, cancelSubscription } =
    usePayment();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    fetchSubscription();
    fetchPlans().then(setPlans);
  }, [fetchSubscription, fetchPlans]);

  const handleUpgrade = useCallback(
    (planId: string) => {
      navigation.navigate('Payment', { planId });
    },
    [navigation]
  );

  const handleCancel = useCallback(() => {
    Alert.alert('구독 해지', '정말 구독을 해지할까요?\n현재 결제 기간까지는 이용할 수 있습니다.', [
      { text: '유지하기', style: 'cancel' },
      {
        text: '해지하기',
        style: 'destructive',
        onPress: async () => {
          const { error } = await cancelSubscription();
          if (error) {
            Alert.alert('오류', error);
          } else {
            Alert.alert('완료', '구독이 해지되었습니다.');
          }
        },
      },
    ]);
  }, [cancelSubscription]);

  const usage = subscription?.usage;
  const isPaid = currentTier !== 'free';
  const periodEnd = subscription?.current_period_end;
  const remainingDays = useMemo(() => {
    if (!periodEnd) return 0;
    return getRemainingDays(periodEnd);
  }, [periodEnd]);

  return (
    <LinearGradient
      colors={[...Colors.darkGradient] as [string, string, ...string[]]}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View entering={stagger(0)}>
          <XStack
            paddingHorizontal={Layout.screenPadding}
            alignItems="center"
            justifyContent="space-between"
            marginBottom={20}
          >
            <TamaguiPressableScale
              onPress={() => navigation.goBack()}
              style={{ padding: 4 }}
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={theme.textPrimary.val} />
            </TamaguiPressableScale>
            <Text fontSize={17} fontWeight="600" color="$textPrimary" letterSpacing={-0.3}>
              구독 관리
            </Text>
            <YStack width={24} />
          </XStack>
        </Animated.View>

        {/* ── Current Plan Card ── */}
        <Animated.View entering={stagger(1)}>
          <YStack paddingHorizontal={Layout.screenPadding} marginTop={16}>
            <YStack
              backgroundColor="$surface"
              borderRadius={16}
              padding={24}
              borderWidth={0.5}
              borderColor="$borderColor"
            >
              <Text fontSize={12} fontWeight="600" color="$textTertiary" letterSpacing={0.5}>
                현재 플랜
              </Text>
              <Text
                fontSize={32}
                fontWeight="200"
                color="$textPrimary"
                letterSpacing={-3}
                marginTop={4}
              >
                {TIER_NAMES[currentTier]}
              </Text>
              {isPaid && subscription?.current_period_end && (
                <Text
                  fontSize={12}
                  fontWeight="400"
                  color="$textTertiary"
                  marginTop={8}
                  letterSpacing={-0.2}
                >
                  {remainingDays}일 남음
                </Text>
              )}
            </YStack>
          </YStack>
        </Animated.View>

        {/* ── Usage Dashboard ── */}
        <Animated.View entering={stagger(2)}>
          <YStack paddingHorizontal={Layout.screenPadding} marginTop={16}>
            <Text
              fontSize={13}
              fontWeight="700"
              color="$textPrimary"
              letterSpacing={-0.2}
              marginBottom={12}
            >
              사용량
            </Text>
            <YStack
              backgroundColor="$surface"
              borderRadius={16}
              padding={20}
              gap={18}
              borderWidth={0.5}
              borderColor="$borderColor"
            >
              {USAGE_ITEMS.map((item) => (
                <QuotaBar
                  key={item.label}
                  label={item.label}
                  used={usage?.[item.usedKey] ?? 0}
                  total={
                    PLAN_LIMITS[currentTier][item.limitKey] === -1
                      ? Infinity
                      : PLAN_LIMITS[currentTier][item.limitKey]
                  }
                  iconName={
                    item.label === '입학 가능성 분석'
                      ? 'school-outline'
                      : item.label === '빈자리 알림'
                        ? 'notifications-outline'
                        : 'chatbubble-outline'
                  }
                  showUpgradeCta={false}
                />
              ))}
            </YStack>
          </YStack>
        </Animated.View>

        {/* ── Plan Comparison ── */}
        <Animated.View entering={stagger(6)}>
          <YStack paddingHorizontal={Layout.screenPadding} marginTop={16}>
            <Text
              fontSize={13}
              fontWeight="700"
              color="$textPrimary"
              letterSpacing={-0.2}
              marginBottom={12}
            >
              요금제 비교
            </Text>
            <YStack gap={12}>
              {TIERS.map((tier) => (
                <PlanColumn
                  key={tier}
                  tier={tier}
                  isCurrentTier={currentTier === tier}
                  plan={plans.find((p) => p.tier === tier)}
                  onUpgrade={handleUpgrade}
                />
              ))}
            </YStack>
          </YStack>
        </Animated.View>

        {/* ── Cancel Subscription ── */}
        {isPaid && (
          <Animated.View entering={stagger(7)}>
            <YStack marginTop={32} alignItems="center" paddingBottom={20}>
              <TamaguiPressableScale onPress={handleCancel} hapticType="light">
                <Text fontSize={13} fontWeight="500" color="$textTertiary" letterSpacing={-0.2}>
                  구독 해지
                </Text>
              </TamaguiPressableScale>
            </YStack>
          </Animated.View>
        )}

        {/* ── Social Proof Footer ── */}
        <YStack alignItems="center" gap="$3" marginTop="$6" paddingBottom="$5">
          <XStack alignItems="center" gap="$2">
            <Ionicons name="shield-checkmark-outline" size={14} color={theme.textTertiary.val} />
            <Text fontSize={12} color="$textTertiary">언제든 해지 가능</Text>
          </XStack>
          <SocialProofBadge count={5432} label="{count}명이 이용 중" size="sm" />
        </YStack>
      </ScrollView>
    </LinearGradient>
  );
}

export default SubscriptionScreen;

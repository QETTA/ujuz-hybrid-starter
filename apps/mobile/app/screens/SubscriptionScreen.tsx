/**
 * SubscriptionScreen - 구독 관리
 *
 * 2026 Design Language:
 * - LinearGradient background (brandSplashGradient)
 * - Monochrome gray scale, tight letterSpacing, variable weight
 * - All Korean text except "Ujuz" brand
 * - No emojis, no artificial icons
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- Tamagui style type workaround (see error-patterns.md) */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { RootStackNavigationProp } from '@/app/types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
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

const TIER_ICONS: Record<PlanTier, string> = {
  free: 'leaf-outline',
  basic: 'star-outline',
  premium: 'diamond-outline',
};

const TIER_BADGE_COLORS: Record<PlanTier, string> = {
  free: Colors.darkTextTertiary,
  basic: Colors.darkTextPrimary,
  premium: Colors.darkTextPrimary,
};

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

function UsageBar({
  label,
  used,
  limit,
  index,
}: {
  label: string;
  used: number;
  limit: number;
  index: number;
}) {
  const isUnlimited = limit === -1;
  const ratio = isUnlimited ? 0 : Math.min(used / Math.max(limit, 1), 1);
  const displayLimit = isUnlimited ? '---' : String(limit);

  return (
    <Animated.View entering={stagger(3 + index)} style={styles.usageRow}>
      <View style={styles.usageHeader}>
        <TamaguiText
          style={
            {
              fontSize: 13,
              fontWeight: '500',
              color: Colors.darkTextSecondary,
              letterSpacing: -0.2,
            } as any
          }
        >
          {label}
        </TamaguiText>
        <View style={styles.usageNumbers}>
          <TamaguiText
            style={
              {
                fontSize: 18,
                fontWeight: '200',
                color: Colors.darkTextPrimary,
                letterSpacing: -0.5,
              } as any
            }
          >
            {used}
          </TamaguiText>
          <TamaguiText
            style={
              {
                fontSize: 12,
                fontWeight: '400',
                color: Colors.darkTextTertiary,
                letterSpacing: -0.2,
              } as any
            }
          >
            {' / '}
            {displayLimit}
          </TamaguiText>
        </View>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${ratio * 100}%` as any }]} />
      </View>
    </Animated.View>
  );
}

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
  const isPremium = tier === 'premium';

  return (
    <View
      style={[
        styles.planCard,
        isCurrentTier && styles.planCardSelected,
        isPremium && styles.planCardPremium,
      ]}
    >
      {/* Plan Header */}
      <View style={styles.planHeader}>
        <View style={styles.planIconWrap}>
          <Ionicons
            name={TIER_ICONS[tier] as any}
            size={18}
            color={isCurrentTier ? Colors.white : TIER_BADGE_COLORS[tier]}
          />
        </View>
        <View style={styles.planTitleBlock}>
          <View style={styles.planTitleRow}>
            <TamaguiText
              style={
                {
                  fontSize: 18,
                  fontWeight: '700',
                  color: isCurrentTier ? Colors.white : Colors.text,
                  letterSpacing: -0.5,
                } as any
              }
            >
              {TIER_NAMES[tier]}
            </TamaguiText>
            {isCurrentTier && (
              <View style={styles.currentBadge}>
                <TamaguiText
                  style={
                    {
                      fontSize: 10,
                      fontWeight: '700',
                      color: Colors.white,
                      letterSpacing: 0.3,
                    } as any
                  }
                >
                  현재
                </TamaguiText>
              </View>
            )}
            {isPremium && !isCurrentTier && (
              <View style={styles.recommendBadge}>
                <TamaguiText
                  style={
                    {
                      fontSize: 10,
                      fontWeight: '700',
                      color: Colors.white,
                      letterSpacing: 0.3,
                    } as any
                  }
                >
                  추천
                </TamaguiText>
              </View>
            )}
          </View>
          {tier === 'free' ? (
            <TamaguiText
              style={
                {
                  fontSize: 13,
                  fontWeight: '400',
                  color: isCurrentTier ? Colors.whiteAlpha70 : Colors.darkTextTertiary,
                  letterSpacing: -0.2,
                  marginTop: 2,
                } as any
              }
            >
              무료
            </TamaguiText>
          ) : (
            <View style={[styles.priceRow, { marginTop: 2 }]}>
              <TamaguiText
                style={
                  {
                    fontSize: 13,
                    fontWeight: '400',
                    color: isCurrentTier ? Colors.whiteAlpha70 : Colors.darkTextTertiary,
                    letterSpacing: -0.2,
                  } as any
                }
              >
                월{' '}
              </TamaguiText>
              <TamaguiText
                style={
                  {
                    fontSize: 22,
                    fontWeight: '200',
                    color: isCurrentTier ? Colors.white : Colors.text,
                    letterSpacing: -1,
                  } as any
                }
              >
                {TIER_PRICES[tier]}
              </TamaguiText>
              <TamaguiText
                style={
                  {
                    fontSize: 13,
                    fontWeight: '400',
                    color: isCurrentTier ? Colors.whiteAlpha70 : Colors.darkTextTertiary,
                    letterSpacing: -0.2,
                  } as any
                }
              >
                원
              </TamaguiText>
            </View>
          )}
        </View>
      </View>

      <View
        style={[styles.planDivider, isCurrentTier && { backgroundColor: Colors.whiteAlpha15 }]}
      />

      {/* Feature List */}
      {COMPARISON_ROWS.map((row) => (
        <View key={row.label} style={styles.comparisonRow}>
          <View style={styles.featureRow}>
            <Ionicons
              name={row[tier] === '-' ? 'close-circle-outline' : 'checkmark-circle'}
              size={16}
              color={
                isCurrentTier
                  ? row[tier] === '-'
                    ? Colors.whiteAlpha30
                    : 'rgba(255,255,255,0.9)' // Note: No whiteAlpha90 token available
                  : row[tier] === '-'
                    ? Colors.darkTextTertiary
                    : Colors.text
              }
            />
            <TamaguiText
              style={
                {
                  fontSize: 13,
                  fontWeight: '500',
                  color: isCurrentTier ? Colors.whiteAlpha80 : Colors.darkTextSecondary,
                  letterSpacing: -0.2,
                  marginLeft: 8,
                } as any
              }
            >
              {row.label}
            </TamaguiText>
          </View>
          <TamaguiText
            style={
              {
                fontSize: 13,
                fontWeight: '600',
                color: isCurrentTier
                  ? Colors.white
                  : row[tier] === '무제한'
                    ? Colors.text
                    : Colors.darkTextSecondary,
                letterSpacing: -0.2,
              } as any
            }
          >
            {row[tier]}
          </TamaguiText>
        </View>
      ))}

      {/* CTA */}
      {!isCurrentTier && tier !== 'free' && (
        <TamaguiPressableScale
          style={[styles.upgradeBtn, isPremium && !isCurrentTier && styles.upgradeBtnPremium]}
          onPress={() => onUpgrade(plan?.id ?? tier)}
          hapticType="medium"
        >
          <TamaguiText
            style={
              {
                fontSize: 14,
                fontWeight: '600',
                color: Colors.darkBg,
                letterSpacing: -0.2,
              } as any
            }
          >
            {isPremium ? '프리미엄 시작하기' : '업그레이드'}
          </TamaguiText>
        </TamaguiPressableScale>
      )}
    </View>
  );
}

// ── Main Screen ──

export function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();

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
      style={styles.gradient}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View entering={stagger(0)} style={styles.header}>
          <TamaguiPressableScale
            onPress={() => navigation.goBack()}
            style={{ padding: 4 }}
            hapticType="light"
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TamaguiPressableScale>
          <TamaguiText
            style={
              {
                fontSize: 17,
                fontWeight: '600',
                color: Colors.darkTextPrimary,
                letterSpacing: -0.3,
              } as any
            }
          >
            구독 관리
          </TamaguiText>
          <View style={{ width: 24 }} />
        </Animated.View>

        {/* ── Current Plan Card ── */}
        <Animated.View entering={stagger(1)} style={styles.section}>
          <View style={styles.currentPlanCard}>
            <TamaguiText
              style={
                {
                  fontSize: 12,
                  fontWeight: '600',
                  color: Colors.darkTextTertiary,
                  letterSpacing: 0.5,
                } as any
              }
            >
              현재 플랜
            </TamaguiText>
            <TamaguiText
              style={
                {
                  fontSize: 32,
                  fontWeight: '200',
                  color: Colors.darkTextPrimary,
                  letterSpacing: -3,
                  marginTop: 4,
                } as any
              }
            >
              {TIER_NAMES[currentTier]}
            </TamaguiText>
            {isPaid && subscription?.current_period_end && (
              <TamaguiText
                style={
                  {
                    fontSize: 12,
                    fontWeight: '400',
                    color: Colors.darkTextTertiary,
                    marginTop: 8,
                    letterSpacing: -0.2,
                  } as any
                }
              >
                {remainingDays}일 남음
              </TamaguiText>
            )}
          </View>
        </Animated.View>

        {/* ── Usage Dashboard ── */}
        <Animated.View entering={stagger(2)} style={styles.section}>
          <TamaguiText
            style={
              {
                fontSize: 13,
                fontWeight: '700',
                color: Colors.darkTextPrimary,
                letterSpacing: -0.2,
                marginBottom: 12,
              } as any
            }
          >
            사용량
          </TamaguiText>
          <View style={styles.usageCard}>
            {USAGE_ITEMS.map((item, idx) => (
              <UsageBar
                key={item.label}
                label={item.label}
                used={usage?.[item.usedKey] ?? 0}
                limit={PLAN_LIMITS[currentTier][item.limitKey]}
                index={idx}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Plan Comparison ── */}
        <Animated.View entering={stagger(6)} style={styles.section}>
          <TamaguiText
            style={
              {
                fontSize: 13,
                fontWeight: '700',
                color: Colors.darkTextPrimary,
                letterSpacing: -0.2,
                marginBottom: 12,
              } as any
            }
          >
            요금제 비교
          </TamaguiText>
          <View style={styles.plansContainer}>
            {TIERS.map((tier) => (
              <PlanColumn
                key={tier}
                tier={tier}
                isCurrentTier={currentTier === tier}
                plan={plans.find((p) => p.tier === tier)}
                onUpgrade={handleUpgrade}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Cancel Subscription ── */}
        {isPaid && (
          <Animated.View entering={stagger(7)} style={styles.cancelSection}>
            <TamaguiPressableScale onPress={handleCancel} hapticType="light">
              <TamaguiText
                style={
                  {
                    fontSize: 13,
                    fontWeight: '500',
                    color: Colors.darkTextTertiary,
                    letterSpacing: -0.2,
                  } as any
                }
              >
                구독 해지
              </TamaguiText>
            </TamaguiPressableScale>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

export default SubscriptionScreen;

// ── Styles ──

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 20,
  },

  section: {
    paddingHorizontal: Layout.screenPadding,
    marginTop: 16,
  },

  // Current Plan
  currentPlanCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },

  // Usage Dashboard
  usageCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    padding: 20,
    gap: 18,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },

  usageRow: {},

  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },

  usageNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  progressBarBg: {
    height: 4,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // Plans
  plansContainer: {
    gap: 12,
  },

  planCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },

  planCardSelected: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.darkSurfaceElevated,
  },

  planCardPremium: {
    borderColor: Colors.darkBorder,
  },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  planIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  planTitleBlock: {
    flex: 1,
  },

  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.whiteAlpha25,
  },

  recommendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },

  planDivider: {
    height: 0.5,
    backgroundColor: Colors.darkBorder,
    marginVertical: 16,
  },

  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },

  upgradeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  upgradeBtnPremium: {
    backgroundColor: Colors.primary,
  },

  // Cancel
  cancelSection: {
    marginTop: 32,
    alignItems: 'center',
    paddingBottom: 20,
  },
});

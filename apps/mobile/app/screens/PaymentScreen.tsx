/**
 * PaymentScreen - 결제 처리
 *
 * Dark-first 2026 Design
 * MongoDB: user_subscriptions 업데이트 via /api/ujuz/payments/request
 * PG 연동: card / kakao_pay / naver_pay / bank_transfer
 */

import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type { RootStackParamList, RootStackNavigationProp } from '@/app/types/navigation';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { usePayment } from '@/app/hooks/usePayment';
import type { BillingCycle, PaymentRequest, SubscriptionPlan } from '@/app/types/subscription';

// ── Constants ──

type PaymentMethod = PaymentRequest['payment_method'];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: '카드 결제' },
  { value: 'kakao_pay', label: '카카오페이' },
  { value: 'naver_pay', label: '네이버페이' },
  { value: 'bank_transfer', label: '계좌이체' },
];

const PLAN_DISPLAY: Record<string, { name: string; monthlyPrice: number }> = {
  basic: { name: 'Basic', monthlyPrice: 9900 },
  premium: { name: 'Premium', monthlyPrice: 19900 },
};

// ── Stagger Animation ──

const stagger = (i: number) =>
  FadeInDown.delay(i * 60)
    .springify()
    .damping(18)
    .stiffness(120)
    .mass(0.8);

// ── Component ──

export function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Payment'>>();
  const planId: string = route.params?.planId ?? 'basic';

  const { subscribe, fetchPlans, isLoading } = usePayment();

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  useEffect(() => {
    fetchPlans().then((plans) => {
      const found = plans.find((p) => p.id === planId || p.tier === planId);
      if (found) setPlan(found);
    });
  }, [planId, fetchPlans]);

  // ── Derived Values ──

  const monthlyPrice = plan?.price_monthly ?? PLAN_DISPLAY[planId]?.monthlyPrice ?? 9900;
  const yearlyPrice = plan?.price_yearly ?? monthlyPrice * 10;
  const displayName = plan?.name ?? PLAN_DISPLAY[planId]?.name ?? 'Basic';

  const isYearly = billingCycle === 'yearly';
  const subscriptionPrice = isYearly ? yearlyPrice : monthlyPrice;
  const yearlyDiscount = isYearly ? monthlyPrice * 12 - yearlyPrice : 0;
  const totalPrice = subscriptionPrice;

  // ── Handlers ──

  const handlePay = useCallback(async () => {
    if (!plan) return;

    const request: PaymentRequest = {
      plan_id: plan.id,
      billing_cycle: billingCycle,
      payment_method: paymentMethod,
    };

    const { result, error } = await subscribe(request);
    if (result?.status === 'completed') {
      Alert.alert('결제 완료', `${displayName} 플랜이 활성화되었습니다.`, [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } else if (error) {
      Alert.alert('결제 실패', error);
    }
  }, [plan, billingCycle, paymentMethod, subscribe, displayName, navigation]);

  // ── Loading State ──

  if (!plan) {
    return (
      <View style={styles.loadingContainer}>
        <View style={{ paddingTop: insets.top + 60 }}>
          <ActivityIndicator color={Colors.darkTextTertiary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View entering={stagger(0)} style={styles.header}>
          <TamaguiPressableScale
            onPress={() => navigation.goBack()}
            hapticType="light"
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.darkTextPrimary} />
          </TamaguiPressableScale>
          <TamaguiText preset="h3" style={styles.headerTitle}>
            결제
          </TamaguiText>
        </Animated.View>

        {/* ── Plan Summary Card ── */}
        <Animated.View entering={stagger(1)} style={styles.section}>
          <View style={styles.card}>
            <TamaguiText style={styles.planName}>{displayName}</TamaguiText>
            <TamaguiText style={styles.planPrice}>
              {isYearly
                ? `₩${yearlyPrice.toLocaleString()}/년`
                : `₩${monthlyPrice.toLocaleString()}/월`}
            </TamaguiText>
          </View>
        </Animated.View>

        {/* ── Billing Cycle Toggle ── */}
        <Animated.View entering={stagger(2)} style={styles.section}>
          <View style={styles.toggleContainer}>
            <TamaguiPressableScale
              onPress={() => setBillingCycle('monthly')}
              hapticType="light"
              style={[styles.toggleOption, billingCycle === 'monthly' && styles.toggleOptionActive]}
            >
              <TamaguiText
                style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}
              >
                월간
              </TamaguiText>
            </TamaguiPressableScale>

            <TamaguiPressableScale
              onPress={() => setBillingCycle('yearly')}
              hapticType="light"
              style={[styles.toggleOption, billingCycle === 'yearly' && styles.toggleOptionActive]}
            >
              <TamaguiText
                style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}
              >
                연간 (2개월 할인)
              </TamaguiText>
            </TamaguiPressableScale>
          </View>
        </Animated.View>

        {/* ── Payment Method Selection ── */}
        <Animated.View entering={stagger(3)} style={styles.section}>
          {PAYMENT_METHODS.map(({ value, label }) => {
            const isSelected = paymentMethod === value;
            return (
              <TamaguiPressableScale
                key={value}
                onPress={() => setPaymentMethod(value)}
                hapticType="light"
                style={styles.methodCard}
              >
                <View
                  style={[styles.radioCircle, isSelected ? styles.radioFilled : styles.radioEmpty]}
                />
                <TamaguiText style={[styles.methodLabel, isSelected && styles.methodLabelSelected]}>
                  {label}
                </TamaguiText>
              </TamaguiPressableScale>
            );
          })}
        </Animated.View>

        {/* ── Price Summary ── */}
        <Animated.View entering={stagger(4)} style={styles.section}>
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <TamaguiText style={styles.priceLabel}>구독료</TamaguiText>
              <TamaguiText style={styles.priceValue}>
                {isYearly
                  ? `₩${(monthlyPrice * 12).toLocaleString()}`
                  : `₩${monthlyPrice.toLocaleString()}`}
              </TamaguiText>
            </View>

            {isYearly && yearlyDiscount > 0 && (
              <View style={styles.priceRow}>
                <TamaguiText style={styles.priceLabel}>할인</TamaguiText>
                <TamaguiText style={styles.discountValue}>
                  -₩{yearlyDiscount.toLocaleString()}
                </TamaguiText>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <TamaguiText style={styles.totalLabel}>합계</TamaguiText>
              <TamaguiText style={styles.totalValue}>₩{totalPrice.toLocaleString()}</TamaguiText>
            </View>
          </View>
        </Animated.View>

        {/* ── CTA Button ── */}
        <Animated.View entering={stagger(5)} style={styles.section}>
          <TamaguiPressableScale
            onPress={handlePay}
            disabled={isLoading}
            hapticType="medium"
            style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.darkBg} />
            ) : (
              <TamaguiText style={styles.ctaText}>결제하기</TamaguiText>
            )}
          </TamaguiPressableScale>
        </Animated.View>

        {/* ── Legal Footer ── */}
        <Animated.View entering={stagger(6)} style={styles.footerSection}>
          <TamaguiText style={styles.legalText}>
            결제 후 즉시 이용 가능 · 언제든 해지 가능
          </TamaguiText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.8,
  },

  // Section
  section: {
    paddingHorizontal: Layout.screenPadding,
    marginTop: 20,
  },

  // Card
  card: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    padding: 20,
  },

  // Plan Summary
  planName: {
    fontSize: 28,
    fontWeight: '200',
    color: Colors.darkTextPrimary,
    letterSpacing: -1.2,
    marginBottom: 6,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.5,
  },

  // Billing Cycle Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 10,
    padding: 3,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  } as ViewStyle,
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
  },
  toggleTextActive: {
    color: Colors.darkBg,
    fontWeight: '600',
  },

  // Payment Method
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 8,
    gap: 12,
  } as ViewStyle,
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  radioFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radioEmpty: {
    backgroundColor: 'transparent',
    borderColor: Colors.darkTextTertiary,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.3,
  },
  methodLabelSelected: {
    color: Colors.darkTextPrimary,
    fontWeight: '600',
  },

  // Price Summary
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.2,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.darkBorder,
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.5,
  },

  // CTA Button
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  ctaButtonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkBg,
    letterSpacing: -0.3,
  },

  // Footer
  footerSection: {
    paddingHorizontal: Layout.screenPadding,
    marginTop: 20,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PaymentScreen;

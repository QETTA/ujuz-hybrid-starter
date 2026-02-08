/**
 * AdmissionResultScreen - 입학 가능성 결과 (2026 Redesign)
 *
 * 1스크린 규칙: Hero(등급+확률) → 신뢰도 → 안심 문구 → 지금 할 일
 * 모두 above-the-fold에 수렴. 5요인·유사사례는 펼침 영역.
 */

import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView, Share } from 'react-native';
import { Text, useTheme, YStack, XStack } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TamaguiPressableScale, TamaguiEmptyState, ScoreRing, PremiumGate } from '@/app/design-system';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import { useAdmissionStore } from '@/app/stores/admissionStore';
import { usePayment } from '@/app/hooks/usePayment';
import { Layout } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import type { AdmissionFactors, ScoreGrade, SimilarCase } from '@/app/types/admission';

const stagger = (i: number) =>
  FadeInDown.delay(i * 60)
    .springify()
    .damping(18)
    .stiffness(120)
    .mass(0.8);

/** Theme token keys for grade colors (resolved via useTheme) */
const GRADE_THEME_KEY: Record<ScoreGrade, string> = {
  A: 'scoreA',
  B: 'scoreB',
  C: 'scoreC',
  D: 'scoreD',
  F: 'scoreF',
};

/** Grade BG suffix: appended to resolved gradeColor for semi-transparent BG */
const GRADE_BG_ALPHA = '18'; // ~10% opacity — works in both light/dark

const FACTOR_LABELS: Record<keyof AdmissionFactors, string> = {
  turnover_rate: COPY.VACANCY_FACTOR,
  regional_competition: '지역 경쟁률',
  priority_bonus: '우선순위 가점',
  seasonal_factor: '시기 적합성',
  waitlist_factor: '대기 순번',
};

const RESULT_LABELS: Record<SimilarCase['result'], string> = {
  admitted: '입소',
  waiting: '대기중',
  withdrawn: '철회',
};

// 안심 문구 — 등급별
const REASSURANCE: Record<ScoreGrade, string> = {
  A: '현재 조건이 매우 유리해요. 준비 서류를 미리 챙겨두세요.',
  B: '입학 가능성이 높아요. 일정만 잘 맞추면 좋은 결과가 기대돼요.',
  C: '비슷한 조건의 절반이 입소에 성공했어요. 대안도 함께 살펴보세요.',
  D: '지금 바로 대기 접수하면 가능성이 올라갈 수 있어요.',
  F: '조건을 바꿔 다시 분석하거나, 다른 시설을 살펴보세요.',
};

export default function AdmissionResultScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const result = useAdmissionStore((s) => s.lastResult);
  const { getRemainingQuota } = usePayment();
  const [showDetails, setShowDetails] = useState(false);

  const gradeColor = useMemo(
    () =>
      result
        ? (theme as any)[GRADE_THEME_KEY[result.grade]]?.val ?? theme.primary.val
        : theme.textTertiary.val,
    [result, theme],
  );

  const gradeBg = useMemo(
    () => (result ? `${gradeColor}${GRADE_BG_ALPHA}` : theme.surface.val),
    [result, gradeColor, theme.surface.val],
  );

  const isQuotaExhausted = getRemainingQuota('admission_score_limit') <= 0;

  if (!result) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background.val, paddingTop: insets.top + 60 }}>
        <TamaguiEmptyState
          icon="bar-chart-outline"
          title="결과 없음"
          message="입학 가능성 분석을 먼저 진행해주세요"
        />
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${COPY.ADMISSION_SHARE_PREFIX} ${result.facility_name} ${COPY.ADMISSION_TITLE}: ${COPY.GRADE[result.grade] ?? '보통'} (약 ${Math.round(result.probability)}%)`,
      });
    } catch {
      // ignore
    }
  };

  const factors = Object.entries(result.factors) as [
    keyof AdmissionFactors,
    AdmissionFactors[keyof AdmissionFactors],
  ][];

  const actionItems =
    result.recommendations.length > 0
      ? result.recommendations
      : [COPY.ACTION_DEFAULT_1, COPY.ACTION_DEFAULT_2];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Nav Bar ── */}
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Layout.screenPadding,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={Layout.hitSlop}
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary.val} />
        </Pressable>
        <Text fontSize={17} fontWeight="600" color="$textPrimary" letterSpacing={-0.3}>
          {COPY.ADMISSION_HEADER}
        </Text>
        <Pressable
          onPress={handleShare}
          hitSlop={Layout.hitSlop}
          accessibilityLabel={COPY.ACTION_SHARE}
        >
          <Ionicons name="share-outline" size={22} color={theme.textSecondary.val} />
        </Pressable>
      </Animated.View>

      {/* ── HERO: ScoreRing + 확률 (1스크린 핵심) ── */}
      <Animated.View
        entering={stagger(0)}
        style={{
          marginHorizontal: Layout.screenPadding,
          borderRadius: 20,
          padding: 20,
          backgroundColor: gradeBg,
        }}
      >
        <XStack alignItems="center" gap="$4" marginBottom="$4">
          <ScoreRing score={result.probability} grade={result.grade} size="md" showLabel />
          <YStack flex={1}>
            <Text fontSize={15} fontWeight="500" color="$textSecondary" marginBottom={4}>
              {result.facility_name}
            </Text>
            <XStack alignItems="baseline" gap="$2.5">
              <Text fontSize={36} fontWeight="800" letterSpacing={-2} color={gradeColor}>
                {Math.round(result.probability)}%
              </Text>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 10,
                  backgroundColor: gradeColor,
                }}
              >
                <Text fontSize={13} fontWeight="700" color="$textInverse">
                  {COPY.GRADE[result.grade]}
                </Text>
              </View>
            </XStack>
          </YStack>
        </XStack>

        {/* 핵심 수치 2개 */}
        <XStack
          alignItems="center"
          backgroundColor="$surfaceElevated"
          borderRadius={14}
          paddingVertical={14}
          paddingHorizontal={8}
        >
          <YStack flex={1} alignItems="center">
            <Text fontSize={18} fontWeight="700" color="$textPrimary" letterSpacing={-0.5}>
              {Math.round(result.probability)}%
            </Text>
            <Text fontSize={11} color="$textTertiary" marginTop={2}>
              {COPY.ADMISSION_PROBABILITY_LABEL}
            </Text>
          </YStack>
          <View style={{ width: 1, height: 28, backgroundColor: theme.borderColor.val }} />
          <YStack flex={1} alignItems="center">
            <Text fontSize={18} fontWeight="700" color="$textPrimary" letterSpacing={-0.5}>
              {result.estimated_months}개월
            </Text>
            <Text fontSize={11} color="$textTertiary" marginTop={2}>
              {COPY.ADMISSION_WAIT_LABEL}
            </Text>
          </YStack>
          <View style={{ width: 1, height: 28, backgroundColor: theme.borderColor.val }} />
          <YStack flex={1} alignItems="center">
            <ConfidenceBadge confidence={result.confidence} />
          </YStack>
        </XStack>
      </Animated.View>

      {/* ── 신뢰도 shield badge ── */}
      <Animated.View entering={stagger(1)}>
        <XStack alignItems="center" gap="$2" justifyContent="center" marginTop="$3">
          <Ionicons name="shield-checkmark" size={16} color={theme.textTertiary.val} />
          <Text fontSize={13} fontWeight="500" color="$textSecondary">
            {result.similar_cases.length}개 유사사례 기반
          </Text>
          <View
            style={{
              backgroundColor: `${gradeColor}20`,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text fontSize={11} fontWeight="600" color={gradeColor}>
              높은 신뢰도
            </Text>
          </View>
        </XStack>
      </Animated.View>

      {/* ── 안심 문구 ── */}
      <Animated.View
        entering={stagger(2)}
        style={{
          marginHorizontal: Layout.screenPadding,
          marginTop: 20,
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: theme.surface.val,
          borderRadius: 12,
          borderLeftWidth: 3,
          borderLeftColor: theme.primary.val,
        }}
      >
        <Text fontSize={14} fontWeight="500" color="$textSecondary" lineHeight={20}>
          {REASSURANCE[result.grade]}
        </Text>
      </Animated.View>

      {/* ── 지금 할 일 (above the fold) ── */}
      <Animated.View
        entering={stagger(3)}
        style={{ marginTop: 24, paddingHorizontal: Layout.screenPadding }}
      >
        <Text
          fontSize={15}
          fontWeight="700"
          color="$textPrimary"
          marginBottom={12}
          letterSpacing={-0.3}
        >
          {COPY.ACTION_NEXT_TITLE}
        </Text>
        {actionItems.map((item, i) => (
          <XStack
            key={i}
            alignItems="center"
            gap="$3"
            marginBottom={10}
            paddingVertical={8}
            paddingHorizontal={12}
            backgroundColor="$surface"
            borderRadius={12}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 2,
                borderColor: gradeColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text fontSize={13} fontWeight="700" color={gradeColor}>
                {i + 1}
              </Text>
            </View>
            <Text flex={1} fontSize={14} fontWeight="500" color="$textSecondary" lineHeight={20}>
              {item}
            </Text>
          </XStack>
        ))}
      </Animated.View>

      {/* ── 주요 CTA ── */}
      <Animated.View
        entering={stagger(4)}
        style={{ marginTop: 20, paddingHorizontal: Layout.screenPadding, gap: 10 }}
      >
        <TamaguiPressableScale
          style={{
            height: 50,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: gradeColor,
          }}
          onPress={() => navigation.navigate('TOAlertSettings')}
          hapticType="medium"
          accessibilityLabel={COPY.VACANCY_ALERT_CTA}
        >
          <Ionicons name="notifications-outline" size={18} color={theme.background.val} />
          <Text fontSize={16} fontWeight="700" color="$background">
            {COPY.VACANCY_ALERT_CTA}
          </Text>
        </TamaguiPressableScale>

        <TamaguiPressableScale
          style={{
            height: 44,
            borderRadius: 12,
            backgroundColor: theme.surface.val,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: theme.borderColor.val,
          }}
          onPress={() => navigation.navigate('AdmissionScore')}
          hapticType="light"
          accessibilityLabel={COPY.ADMISSION_CTA_RETRY}
        >
          <Text fontSize={14} fontWeight="600" color="$textSecondary">
            {COPY.ADMISSION_CTA_RETRY}
          </Text>
        </TamaguiPressableScale>
      </Animated.View>

      {/* ── PremiumGate (quota exhausted) ── */}
      {isQuotaExhausted && (
        <YStack marginTop="$4" paddingHorizontal={Layout.screenPadding}>
          <PremiumGate
            visible
            featureName="더 많은 시설을 분석하세요"
            inline
            onUpgradePress={() => navigation.navigate('Subscription')}
          >
            <></>
          </PremiumGate>
        </YStack>
      )}

      {/* ── 상세 분석 펼치기 ── */}
      <Pressable
        onPress={() => setShowDetails(!showDetails)}
        hitSlop={Layout.hitSlop}
        accessibilityLabel={showDetails ? '상세 분석 접기' : '상세 분석 펼치기'}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 28,
          paddingVertical: 12,
          borderTopWidth: 0.5,
          borderTopColor: theme.borderColor.val,
          marginHorizontal: Layout.screenPadding,
        }}
      >
        <Text fontSize={14} fontWeight="600" color="$textTertiary">
          {showDetails ? '상세 분석 접기' : '상세 분석 보기'}
        </Text>
        <Ionicons
          name={showDetails ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textTertiary.val}
        />
      </Pressable>

      {showDetails && (
        <>
          {/* 5요인 분석 */}
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={{ marginTop: 24, paddingHorizontal: Layout.screenPadding }}
          >
            <Text
              fontSize={15}
              fontWeight="700"
              color="$textPrimary"
              marginBottom={12}
              letterSpacing={-0.3}
            >
              5요인 분석
            </Text>
            {factors.map(([key, factor]) => (
              <YStack key={key} marginBottom={14}>
                <XStack justifyContent="space-between" marginBottom={5}>
                  <Text fontSize={13} fontWeight="600" color="$textSecondary">
                    {FACTOR_LABELS[key]}
                  </Text>
                  <Text fontSize={13} fontWeight="600" color="$textTertiary">
                    {Math.round(factor.score)}점
                  </Text>
                </XStack>
                <View
                  style={{
                    height: 6,
                    backgroundColor: theme.surfaceElevated.val,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${factor.score}%` as any,
                      backgroundColor:
                        factor.score >= 70
                          ? (theme as any).scoreA?.val
                          : factor.score >= 40
                            ? (theme as any).scoreC?.val
                            : (theme as any).scoreF?.val,
                    }}
                  />
                </View>
              </YStack>
            ))}
          </Animated.View>

          {/* 유사 사례 */}
          {result.similar_cases.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(250).delay(60)}
              style={{ marginTop: 24, paddingHorizontal: Layout.screenPadding }}
            >
              <Text
                fontSize={15}
                fontWeight="700"
                color="$textPrimary"
                marginBottom={12}
                letterSpacing={-0.3}
              >
                유사 사례
              </Text>
              {result.similar_cases.map((c, i) => (
                <XStack
                  key={i}
                  alignItems="center"
                  gap="$2.5"
                  paddingVertical={10}
                  borderBottomWidth={0.5}
                  borderBottomColor="$borderColor"
                >
                  <Text fontSize={13} fontWeight="600" color="$textSecondary" flex={1}>
                    {c.priority_type}
                  </Text>
                  <Text fontSize={13} color="$textTertiary">
                    대기 {c.waiting_months}개월
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor:
                        c.result === 'admitted'
                          ? (theme as any).successBg?.val ?? theme.success.val + '20'
                          : c.result === 'waiting'
                            ? (theme as any).warningBg?.val ?? theme.warning.val + '20'
                            : (theme as any).infoBg?.val ?? theme.info.val + '20',
                    }}
                  >
                    <Text
                      fontSize={11}
                      fontWeight="600"
                      color={
                        c.result === 'admitted'
                          ? theme.success.val
                          : c.result === 'waiting'
                            ? (theme as any).like?.val ?? theme.warning.val
                            : theme.info.val
                      }
                    >
                      {RESULT_LABELS[c.result]}
                    </Text>
                  </View>
                  <Text fontSize={12} color="$textTertiary" width={40} textAlign="right">
                    {c.year}년
                  </Text>
                </XStack>
              ))}
            </Animated.View>
          )}
        </>
      )}

      {/* ── 면책 ── */}
      <Text
        fontSize={11}
        color="$textTertiary"
        textAlign="center"
        marginTop={24}
        marginHorizontal={Layout.screenPadding}
        lineHeight={16}
      >
        {COPY.DISCLAIMER}
      </Text>
    </ScrollView>
  );
}

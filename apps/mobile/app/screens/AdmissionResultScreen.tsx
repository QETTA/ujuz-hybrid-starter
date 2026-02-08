/**
 * AdmissionResultScreen - 입학 가능성 결과 (2026 Redesign)
 *
 * 1스크린 규칙: Hero(등급+확률) → 신뢰도 → 안심 문구 → 지금 할 일
 * 모두 above-the-fold에 수렴. 5요인·유사사례는 펼침 영역.
 */

import { useMemo, useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Share } from 'react-native';
import { Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TamaguiPressableScale, TamaguiEmptyState } from '@/app/design-system';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import { useAdmissionStore } from '@/app/stores/admissionStore';
import { Colors, Layout } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import type { AdmissionFactors, ScoreGrade, SimilarCase } from '@/app/types/admission';

const stagger = (i: number) =>
  FadeInDown.delay(i * 60)
    .springify()
    .damping(18)
    .stiffness(120)
    .mass(0.8);

const GRADE_COLORS: Record<ScoreGrade, string> = {
  A: Colors.success,
  B: Colors.info,
  C: Colors.warning,
  D: Colors.iosSystemOrange,
  F: Colors.error,
};

const GRADE_BG: Record<ScoreGrade, string> = {
  A: Colors.gradeBgA,
  B: Colors.gradeBgB,
  C: Colors.gradeBgC,
  D: Colors.gradeBgD,
  F: Colors.gradeBgF,
};

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const result = useAdmissionStore((s) => s.lastResult);
  const [showDetails, setShowDetails] = useState(false);

  const gradeColor = useMemo(
    () => (result ? GRADE_COLORS[result.grade] : Colors.darkTextTertiary),
    [result]
  );

  const gradeBg = useMemo(() => (result ? GRADE_BG[result.grade] : Colors.darkSurface), [result]);

  if (!result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
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

  const confidencePercent = Math.round(result.confidence * 100);
  const dateStr = new Date(result.calculated_at).toLocaleDateString('ko-KR');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Nav Bar ── */}
      <Animated.View entering={FadeIn.duration(200)} style={styles.nav}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={Layout.hitSlop}
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.darkTextPrimary} />
        </Pressable>
        <Text style={styles.navTitle}>{COPY.ADMISSION_HEADER}</Text>
        <Pressable
          onPress={handleShare}
          hitSlop={Layout.hitSlop}
          accessibilityLabel={COPY.ACTION_SHARE}
        >
          <Ionicons name="share-outline" size={22} color={Colors.darkTextSecondary} />
        </Pressable>
      </Animated.View>

      {/* ── HERO: 등급 + 확률 (1스크린 핵심) ── */}
      <Animated.View entering={stagger(0)} style={[styles.heroCard, { backgroundColor: gradeBg }]}>
        <View style={styles.heroTop}>
          <View style={[styles.gradeCircle, { borderColor: gradeColor }]}>
            <Text style={[styles.gradeLetterBig, { color: gradeColor }]}>{result.grade}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.facilityName}>{result.facility_name}</Text>
            <View style={styles.heroRow}>
              <Text style={[styles.probabilityBig, { color: gradeColor }]}>
                {Math.round(result.probability)}%
              </Text>
              <View style={[styles.gradePill, { backgroundColor: gradeColor }]}>
                <Text style={styles.gradePillText}>{COPY.GRADE[result.grade]}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 핵심 수치 2개 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(result.probability)}%</Text>
            <Text style={styles.statLabel}>{COPY.ADMISSION_PROBABILITY_LABEL}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{result.estimated_months}개월</Text>
            <Text style={styles.statLabel}>{COPY.ADMISSION_WAIT_LABEL}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ConfidenceBadge confidence={result.confidence} />
          </View>
        </View>
      </Animated.View>

      {/* ── 신뢰도 + 날짜 ── */}
      <Animated.View entering={stagger(1)} style={styles.trustLine}>
        <Ionicons name="shield-checkmark-outline" size={14} color={Colors.darkTextTertiary} />
        <Text style={styles.trustText}>{COPY.TRUST_META(confidencePercent, dateStr)}</Text>
      </Animated.View>

      {/* ── 안심 문구 ── */}
      <Animated.View entering={stagger(2)} style={styles.reassurance}>
        <Text style={styles.reassuranceText}>{REASSURANCE[result.grade]}</Text>
      </Animated.View>

      {/* ── 지금 할 일 (above the fold) ── */}
      <Animated.View entering={stagger(3)} style={styles.section}>
        <Text style={styles.sectionTitle}>{COPY.ACTION_NEXT_TITLE}</Text>
        {actionItems.map((item, i) => (
          <View key={i} style={styles.checkRow}>
            <View style={[styles.checkCircle, { borderColor: gradeColor }]}>
              <Text style={[styles.checkNum, { color: gradeColor }]}>{i + 1}</Text>
            </View>
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ── 주요 CTA ── */}
      <Animated.View entering={stagger(4)} style={styles.ctaArea}>
        <TamaguiPressableScale
          style={[styles.ctaPrimary, { backgroundColor: gradeColor }]}
          onPress={() => navigation.navigate('TOAlertSettings')}
          hapticType="medium"
          accessibilityLabel={COPY.VACANCY_ALERT_CTA}
        >
          <Ionicons name="notifications-outline" size={18} color={Colors.darkBg} />
          <Text style={styles.ctaPrimaryText}>{COPY.VACANCY_ALERT_CTA}</Text>
        </TamaguiPressableScale>

        <TamaguiPressableScale
          style={styles.ctaSecondary}
          onPress={() => navigation.navigate('AdmissionScore')}
          hapticType="light"
          accessibilityLabel={COPY.ADMISSION_CTA_RETRY}
        >
          <Text style={styles.ctaSecondaryText}>{COPY.ADMISSION_CTA_RETRY}</Text>
        </TamaguiPressableScale>
      </Animated.View>

      {/* ── 상세 분석 펼치기 ── */}
      <Pressable
        style={styles.expandToggle}
        onPress={() => setShowDetails(!showDetails)}
        hitSlop={Layout.hitSlop}
        accessibilityLabel={showDetails ? '상세 분석 접기' : '상세 분석 펼치기'}
      >
        <Text style={styles.expandText}>{showDetails ? '상세 분석 접기' : '상세 분석 보기'}</Text>
        <Ionicons
          name={showDetails ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.darkTextTertiary}
        />
      </Pressable>

      {showDetails && (
        <>
          {/* 5요인 분석 */}
          <Animated.View entering={FadeInDown.duration(250)} style={styles.section}>
            <Text style={styles.sectionTitle}>5요인 분석</Text>
            {factors.map(([key, factor]) => (
              <View key={key} style={styles.factorRow}>
                <View style={styles.factorHeader}>
                  <Text style={styles.factorName}>{FACTOR_LABELS[key]}</Text>
                  <Text style={styles.factorScore}>{Math.round(factor.score)}점</Text>
                </View>
                <View style={styles.factorBarBg}>
                  <View
                    style={[
                      styles.factorBarFill,
                      {
                        width: `${factor.score}%` as any,
                        backgroundColor:
                          factor.score >= 70
                            ? Colors.success
                            : factor.score >= 40
                              ? Colors.warning
                              : Colors.error,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Animated.View>

          {/* 유사 사례 */}
          {result.similar_cases.length > 0 && (
            <Animated.View entering={FadeInDown.duration(250).delay(60)} style={styles.section}>
              <Text style={styles.sectionTitle}>유사 사례</Text>
              {result.similar_cases.map((c, i) => (
                <View key={i} style={styles.caseRow}>
                  <Text style={styles.casePriority}>{c.priority_type}</Text>
                  <Text style={styles.caseWait}>대기 {c.waiting_months}개월</Text>
                  <View
                    style={[
                      styles.caseChip,
                      {
                        backgroundColor:
                          c.result === 'admitted'
                            ? Colors.badgeVerifiedBg
                            : c.result === 'waiting'
                              ? Colors.badgePopularBg
                              : Colors.badgeNewBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.caseChipText,
                        {
                          color:
                            c.result === 'admitted'
                              ? Colors.badgeVerified
                              : c.result === 'waiting'
                                ? Colors.badgePopular
                                : Colors.badgeNew,
                        },
                      ]}
                    >
                      {RESULT_LABELS[c.result]}
                    </Text>
                  </View>
                  <Text style={styles.caseYear}>{c.year}년</Text>
                </View>
              ))}
            </Animated.View>
          )}
        </>
      )}

      {/* ── 면책 ── */}
      <Text style={styles.disclaimer}>{COPY.DISCLAIMER}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },

  // Nav
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: Layout.screenPadding,
    borderRadius: 20,
    padding: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  gradeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.darkBg,
  },
  gradeLetterBig: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroInfo: { flex: 1 },
  facilityName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
    marginBottom: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  probabilityBig: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -2,
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gradePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // Stats row inside hero
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.darkBorder,
  },

  // Trust line
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  trustText: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
  },

  // Reassurance
  reassurance: {
    marginHorizontal: Layout.screenPadding,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.darkSurface,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  reassuranceText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
    lineHeight: 20,
  },

  // Section
  section: { marginTop: 24, paddingHorizontal: Layout.screenPadding },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  // Action checklist
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.darkSurface,
    borderRadius: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
    lineHeight: 20,
  },

  // CTA
  ctaArea: {
    marginTop: 20,
    paddingHorizontal: Layout.screenPadding,
    gap: 10,
  },
  ctaPrimary: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaPrimaryText: { fontSize: 16, fontWeight: '700', color: Colors.darkBg },
  ctaSecondary: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  ctaSecondaryText: { fontSize: 14, fontWeight: '600', color: Colors.darkTextSecondary },

  // Expand toggle
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.darkBorder,
    marginHorizontal: Layout.screenPadding,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkTextTertiary,
  },

  // Factor bars (compact)
  factorRow: { marginBottom: 14 },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  factorName: { fontSize: 13, fontWeight: '600', color: Colors.darkTextSecondary },
  factorScore: { fontSize: 13, fontWeight: '600', color: Colors.darkTextTertiary },
  factorBarBg: {
    height: 6,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorBarFill: { height: 6, borderRadius: 3 },

  // Similar cases (compact row)
  caseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkBorder,
  },
  casePriority: { fontSize: 13, fontWeight: '600', color: Colors.darkTextSecondary, flex: 1 },
  caseWait: { fontSize: 13, color: Colors.darkTextTertiary },
  caseChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  caseChipText: { fontSize: 11, fontWeight: '600' },
  caseYear: { fontSize: 12, color: Colors.darkTextTertiary, width: 40, textAlign: 'right' },

  disclaimer: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: Layout.screenPadding,
    lineHeight: 16,
  },
});

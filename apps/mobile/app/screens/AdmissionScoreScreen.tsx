/**
 * AdmissionScoreScreen - UJUz (우쥬) 입학 가능성 예측
 *
 * Design language: Splash-consistent soft gradient + monochrome type
 * Typography: 2026 trendy -- tight tracking, variable weight
 * Monochrome: gray scale only, no colored accents
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { XStack } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
// LinearGradient removed — dark-first flat bg
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type { RootStackParamList, RootStackNavigationProp } from '@/app/types/navigation';

import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { useAdmissionScore } from '@/app/hooks/useAdmissionScore';
import { usePayment } from '@/app/hooks/usePayment';
import { useProfileStore } from '@/app/stores/profileStore';
import { placesService } from '@/app/services/mongo/places';
import type { AgeClass, PriorityType } from '@/app/types/auth';
import type { PlaceWithDistance } from '@/app/types/places';
import type { AdmissionScoreInput } from '@/app/types/admission';

// ─── Constants ───────────────────────────────────────────

const stagger = (i: number) =>
  FadeInDown.delay(i * 60)
    .springify()
    .damping(18)
    .stiffness(120)
    .mass(0.8);

const AGE_CLASSES: AgeClass[] = ['0세반', '1세반', '2세반', '3세반', '4세반', '5세반'];

const PRIORITY_OPTIONS: { value: PriorityType; label: string }[] = [
  { value: 'dual_income', label: '맞벌이' },
  { value: 'single_parent', label: '한부모' },
  { value: 'multi_child', label: '다자녀' },
  { value: 'basic_livelihood', label: '기초생활' },
  { value: 'disability', label: '장애' },
  { value: 'government_merit', label: '국가유공' },
  { value: 'low_income', label: '저소득' },
  { value: 'near_workplace', label: '직장 인근' },
  { value: 'sibling_enrolled', label: '재원 형제' },
  { value: 'none', label: '해당없음' },
];

const ADDITIONAL_PRIORITY_OPTIONS = PRIORITY_OPTIONS.filter((p) => p.value !== 'none');

// ─── Types ───────────────────────────────────────────────

export interface AdmissionScoreScreenProps {
  testID?: string;
}

// ═════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════

export function AdmissionScoreScreen({ testID }: AdmissionScoreScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdmissionScore'>>();

  // ─── Data ──────────────────────────────────────────
  const { calculateScore, isCalculating } = useAdmissionScore();
  const { canUseFeature, getRemainingQuota } = usePayment();
  const childName = useProfileStore((s) => s.childName);
  const childBirthDate = useProfileStore((s) => s.childBirthDate);
  const getChildAgeMonths = useProfileStore((s) => s.getChildAgeMonths);

  // ─── State ─────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceWithDistance[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<PlaceWithDistance | null>(null);

  const initialAgeClass = useMemo((): AgeClass => {
    const months = getChildAgeMonths();
    const year = Math.min(Math.floor(months / 12), 5);
    return `${year}세반` as AgeClass;
  }, [getChildAgeMonths]);

  const [selectedClass, setSelectedClass] = useState<AgeClass>(initialAgeClass);
  const [selectedPriority, setSelectedPriority] = useState<PriorityType>('dual_income');
  const [additionalPriorities, setAdditionalPriorities] = useState<PriorityType[]>([]);

  // ─── Computed ──────────────────────────────────────
  const remaining = getRemainingQuota('admission_score_limit');
  const canUse = canUseFeature('admission_score_limit');

  const ageLabel = useMemo(() => {
    const months = getChildAgeMonths();
    return months >= 12 ? `${Math.floor(months / 12)}세` : `${months}개월`;
  }, [getChildAgeMonths]);

  const filteredAdditional = useMemo(
    () => ADDITIONAL_PRIORITY_OPTIONS.filter((p) => p.value !== selectedPriority),
    [selectedPriority]
  );

  // ─── Effects ───────────────────────────────────────
  useEffect(() => {
    const fid = route.params?.facilityId as string | undefined;
    if (fid) {
      placesService.getById(fid).then((place) => {
        if (place) setSelectedFacility(place);
      });
    }
  }, [route.params?.facilityId]);

  // ─── Handlers ──────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await placesService.searchByText(query, 10);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const handleSelectFacility = useCallback((place: PlaceWithDistance) => {
    setSelectedFacility(place);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleClearFacility = useCallback(() => {
    setSelectedFacility(null);
  }, []);

  const toggleAdditional = useCallback((p: PriorityType) => {
    setAdditionalPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }, []);

  const handleCalculate = useCallback(async () => {
    if (!selectedFacility) {
      Alert.alert('시설 선택', '어린이집을 선택해주세요');
      return;
    }

    if (!canUse) {
      navigation.navigate('Subscription');
      return;
    }

    const input: AdmissionScoreInput = {
      facility_id: selectedFacility.id,
      child_id: 'default',
      target_class: selectedClass,
      priority_type: selectedPriority,
      additional_priorities: additionalPriorities,
    };

    const { result, error } = await calculateScore(input);
    if (result) {
      navigation.navigate('AdmissionResult', { resultId: result.id });
    } else if (error) {
      Alert.alert('오류', error);
    }
  }, [
    selectedFacility,
    selectedClass,
    selectedPriority,
    additionalPriorities,
    canUse,
    calculateScore,
    navigation,
  ]);

  // ─── Render ────────────────────────────────────────
  return (
    <View testID={testID} style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── 헤더 ─────────────────────────────────── */}
        <Animated.View
          entering={stagger(0)}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TamaguiPressableScale
            hapticType="light"
            style={styles.hitArea}
            onPress={() => navigation.goBack()}
            accessibilityLabel="뒤로 가기"
            accessibilityHint="이전 화면으로 돌아갑니다"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.darkTextPrimary} />
          </TamaguiPressableScale>

          <View style={styles.headerCenter}>
            <TamaguiText style={styles.headerTitle}>입학 가능성 예측</TamaguiText>
          </View>

          <View style={styles.quotaBadge}>
            <TamaguiText style={styles.quotaText}>
              {remaining === Infinity ? '무제한' : `${remaining}회`}
            </TamaguiText>
          </View>
        </Animated.View>

        {/* ── 스텝 프로그레스 ─────────────────────── */}
        <Animated.View entering={stagger(1)} style={styles.stepSection}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <TamaguiText style={styles.stepNum}>1</TamaguiText>
            </View>
            <View style={[styles.stepLine, styles.stepLineActive]} />
            <View
              style={[
                styles.stepDot,
                selectedFacility ? styles.stepDotActive : styles.stepDotInactive,
              ]}
            >
              <TamaguiText style={[styles.stepNum, !selectedFacility && styles.stepNumInactive]}>
                2
              </TamaguiText>
            </View>
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, styles.stepDotInactive]}>
              <TamaguiText style={[styles.stepNum, styles.stepNumInactive]}>3</TamaguiText>
            </View>
          </View>
          <View style={styles.stepLabels}>
            <TamaguiText style={styles.stepLabel}>시설 선택</TamaguiText>
            <TamaguiText style={[styles.stepLabel, !selectedFacility && styles.stepLabelInactive]}>
              정보 입력
            </TamaguiText>
            <TamaguiText style={[styles.stepLabel, styles.stepLabelInactive]}>
              결과 확인
            </TamaguiText>
          </View>
        </Animated.View>

        {/* ── 브랜드 ───────────────────────────────── */}
        <Animated.View entering={stagger(2)} style={styles.section}>
          <TamaguiText style={styles.logo}>Ujuz</TamaguiText>
          <TamaguiText style={styles.pageDesc}>
            이 어린이집에 내 아이가{'\n'}들어갈 수 있을까?
          </TamaguiText>
        </Animated.View>

        {/* ── 어린이집 검색 ────────────────────────── */}
        <Animated.View entering={stagger(3)} style={styles.section}>
          <TamaguiText style={styles.sectionLabel}>어린이집 선택</TamaguiText>

          {selectedFacility ? (
            <TamaguiPressableScale
              hapticType="light"
              style={styles.selectedCard}
              onPress={handleClearFacility}
            >
              <View style={styles.selectedInfo}>
                <TamaguiText style={styles.facilityName}>{selectedFacility.name}</TamaguiText>
                <TamaguiText style={styles.facilityAddr}>{selectedFacility.address}</TamaguiText>
              </View>
              <TamaguiText style={styles.changeLabel}>변경</TamaguiText>
            </TamaguiPressableScale>
          ) : (
            <View>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search"
                  size={16}
                  color={Colors.darkTextTertiary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="어린이집 이름 검색"
                  placeholderTextColor={Colors.darkTextTertiary}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>

              {searchResults.length > 0 && (
                <View style={styles.dropdown}>
                  {searchResults.map((place) => (
                    <TamaguiPressableScale
                      key={place.id}
                      hapticType="light"
                      style={styles.dropdownItem}
                      onPress={() => handleSelectFacility(place)}
                    >
                      <TamaguiText style={styles.dropdownName}>{place.name}</TamaguiText>
                      <TamaguiText style={styles.dropdownAddr}>{place.address}</TamaguiText>
                    </TamaguiPressableScale>
                  ))}
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* ── 아이 정보 (자동 반영) ─────────────────── */}
        <Animated.View entering={stagger(4)} style={styles.section}>
          <TamaguiText style={styles.sectionLabel}>아이 정보</TamaguiText>
          <View style={styles.infoCard}>
            <InfoRow label="이름" value={childName} />
            <InfoRow label="생년월일" value={childBirthDate} />
            <InfoRow label="월령" value={`${getChildAgeMonths()}개월`} />
            <InfoRow label="연령반" value={ageLabel} />
          </View>
        </Animated.View>

        {/* ── 희망 연령반 ───────────────────────────── */}
        <Animated.View entering={stagger(4)} style={styles.section}>
          <TamaguiText style={styles.sectionLabel}>희망 연령반</TamaguiText>
          <View style={styles.chipRow}>
            {AGE_CLASSES.map((cls) => (
              <SelectChip
                key={cls}
                label={cls}
                selected={selectedClass === cls}
                onPress={() => setSelectedClass(cls)}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── 우선순위 유형 ─────────────────────────── */}
        <Animated.View entering={stagger(5)} style={styles.section}>
          <TamaguiText style={styles.sectionLabel}>입소 우선순위</TamaguiText>
          <View style={styles.chipRow}>
            {PRIORITY_OPTIONS.map(({ value, label }) => (
              <SelectChip
                key={value}
                label={label}
                selected={selectedPriority === value}
                onPress={() => setSelectedPriority(value)}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── 추가 우선순위 ─────────────────────────── */}
        <Animated.View entering={stagger(6)} style={styles.section}>
          <TamaguiText style={styles.sectionLabel}>추가 우선순위</TamaguiText>
          <TamaguiText style={styles.sectionHint}>해당하는 항목을 모두 선택하세요</TamaguiText>
          <View style={styles.chipRow}>
            {filteredAdditional.map(({ value, label }) => (
              <CheckChip
                key={value}
                label={label}
                checked={additionalPriorities.includes(value)}
                onPress={() => toggleAdditional(value)}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── 무료 횟수 초과 시 페이월 ────────────── */}
        {!canUse && (
          <Animated.View entering={stagger(7)} style={styles.section}>
            <TamaguiPressableScale
              hapticType="medium"
              onPress={() => navigation.navigate('Subscription')}
            >
              <View style={styles.paywallCard}>
                <TamaguiText style={styles.paywallTitle}>
                  이번 달 무료 예측을 모두 사용했어요
                </TamaguiText>
                <TamaguiText style={styles.paywallBody}>
                  프리미엄에서 무제한으로 이용하세요
                </TamaguiText>
                <View style={styles.paywallCta}>
                  <TamaguiText style={styles.paywallCtaText}>프리미엄 보기</TamaguiText>
                  <Ionicons name="chevron-forward" size={14} color={Colors.darkBg} />
                </View>
              </View>
            </TamaguiPressableScale>
          </Animated.View>
        )}

        {/* ── CTA 버튼 ─────────────────────────────── */}
        <Animated.View entering={stagger(8)} style={styles.section}>
          <TamaguiPressableScale
            hapticType="medium"
            style={[
              styles.ctaButton,
              (!selectedFacility || isCalculating || !canUse) && styles.ctaButtonDisabled,
            ]}
            onPress={handleCalculate}
            disabled={!selectedFacility || isCalculating || !canUse}
            accessibilityLabel="입학 가능성 확인하기"
            accessibilityHint="입학 가능성을 분석합니다"
          >
            {isCalculating ? (
              <ActivityIndicator color={Colors.darkBg} size="small" />
            ) : (
              <TamaguiText style={styles.ctaText}>입학 가능성 확인하기</TamaguiText>
            )}
          </TamaguiPressableScale>

          <TamaguiText style={styles.disclaimer}>
            대기 현황 및 지역 경쟁률 기반 예측 결과입니다
          </TamaguiText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical={6}>
      <TamaguiText style={styles.infoLabel}>{label}</TamaguiText>
      <TamaguiText style={styles.infoValue}>{value}</TamaguiText>
    </XStack>
  );
}

function SelectChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TamaguiPressableScale
      hapticType="light"
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <TamaguiText style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </TamaguiText>
    </TamaguiPressableScale>
  );
}

function CheckChip({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <TamaguiPressableScale
      hapticType="light"
      style={[styles.checkChip, checked && styles.checkChipChecked]}
      onPress={onPress}
    >
      {checked && (
        <Ionicons name="checkmark" size={12} color={Colors.darkBg} style={styles.checkIcon} />
      )}
      <TamaguiText style={[styles.checkChipText, checked && styles.checkChipTextChecked]}>
        {label}
      </TamaguiText>
    </TamaguiPressableScale>
  );
}

// ═════════════════════════════════════════════════════════
// Styles -- 2026 Splash-consistent, monochrome
// ═════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },

  // ── 헤더 ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 4,
  },
  hitArea: {
    padding: 12,
    margin: -12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },
  quotaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 10,
  },
  quotaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.2,
  },

  // ── 스텝 프로그레스 ────────────────────────────
  stepSection: {
    paddingHorizontal: Layout.screenPadding,
    marginTop: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotInactive: {
    backgroundColor: Colors.darkSurfaceElevated,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkBg,
    letterSpacing: -0.2,
  },
  stepNumInactive: {
    color: Colors.darkTextTertiary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.darkSurfaceElevated,
    marginHorizontal: 4,
    maxWidth: 60,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
    textAlign: 'center',
    width: 60,
  },
  stepLabelInactive: {
    color: Colors.darkTextTertiary,
  },

  // ── 공통 ──────────────────────────────────────
  section: {
    paddingHorizontal: Layout.screenPadding,
    marginTop: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    color: Colors.darkTextPrimary,
    letterSpacing: -1.8,
  },
  pageDesc: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.8,
    lineHeight: 32,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
    marginBottom: 10,
    marginTop: -4,
  },

  // ── 검색 ──────────────────────────────────────
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkSurface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontWeight: '400',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: Colors.darkSurface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkBorder,
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
  },
  dropdownAddr: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.1,
    marginTop: 2,
  },

  // ── 선택된 시설 ────────────────────────────────
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.darkSurface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    padding: 16,
  },
  selectedInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },
  facilityAddr: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.1,
    marginTop: 2,
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: -0.2,
  },

  // ── 아이 정보 ──────────────────────────────────
  infoCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
  },

  // ── 칩 (단일 선택) ────────────────────────────
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.darkSurface,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.2,
  },
  chipTextSelected: {
    color: Colors.darkBg,
    fontWeight: '600',
  },

  // ── 칩 (다중 선택 / 체크) ──────────────────────
  checkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.darkSurface,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  checkChipChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkIcon: {
    marginRight: 4,
  },
  checkChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.1,
  },
  checkChipTextChecked: {
    color: Colors.darkBg,
    fontWeight: '600',
  },

  // ── 페이월 ─────────────────────────────────────
  paywallCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    padding: 20,
  },
  paywallTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  paywallBody: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  paywallCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 4,
  },
  paywallCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkBg,
    letterSpacing: -0.3,
  },

  // ── CTA ────────────────────────────────────────
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkBg,
    letterSpacing: -0.3,
  },
  disclaimer: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.1,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default AdmissionScoreScreen;

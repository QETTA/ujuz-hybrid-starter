/**
 * AdmissionScoreScreen - UJUz (우쥬) 입학 가능성 예측
 *
 * Design language: Splash-consistent soft gradient + monochrome type
 * Typography: 2026 trendy -- tight tracking, variable weight
 * Monochrome: gray scale only, no colored accents
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTheme, XStack, YStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type { RootStackParamList, RootStackNavigationProp } from '@/app/types/navigation';

import { Layout } from '@/app/constants';
import {
  TamaguiPressableScale,
  TamaguiHeader,
  TamaguiInput,
  TamaguiChip,
  TamaguiChipGroup,
  QuotaBar,
  PremiumGate,
} from '@/app/design-system';
import { useAdmissionScore } from '@/app/hooks/useAdmissionScore';
import { usePayment } from '@/app/hooks/usePayment';
import { useProfileStore } from '@/app/stores/profileStore';
import { placesService } from '@/app/services/mongo/places';
import type { AgeClass, PriorityType } from '@/app/types/auth';
import type { PlaceWithDistance } from '@/app/types/places';
import type { AdmissionScoreInput } from '@/app/types/admission';
import { PLAN_LIMITS } from '@/app/types/subscription';

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
  const theme = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdmissionScore'>>();

  // ─── Data ──────────────────────────────────────────
  const { calculateScore, isCalculating } = useAdmissionScore();
  const { canUseFeature, getRemainingQuota, currentTier } = usePayment();
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

  const admissionRawLimit = PLAN_LIMITS[currentTier].admission_score_limit;
  const totalLimit = admissionRawLimit === -1 ? 0 : admissionRawLimit;

  const ageLabel = useMemo(() => {
    const months = getChildAgeMonths();
    return months >= 12 ? `${Math.floor(months / 12)}세` : `${months}개월`;
  }, [getChildAgeMonths]);

  const filteredAdditional = useMemo(
    () => ADDITIONAL_PRIORITY_OPTIONS.filter((p) => p.value !== selectedPriority),
    [selectedPriority]
  );

  const headerHeight = 56 + insets.top;

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
    <YStack testID={testID} flex={1} backgroundColor="$background">
      <TamaguiHeader
        title="입학 가능성 예측"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 100 }}
      >
        {/* ── 스텝 프로그레스 ─────────────────────── */}
        <Animated.View
          entering={stagger(1)}
          style={{ paddingHorizontal: Layout.screenPadding, marginTop: 16 }}
        >
          <XStack alignItems="center" justifyContent="center">
            <YStack
              width={28}
              height={28}
              borderRadius={14}
              alignItems="center"
              justifyContent="center"
              backgroundColor="$primary"
            >
              <Text fontSize={12} fontWeight="700" color="$background" letterSpacing={-0.2}>
                1
              </Text>
            </YStack>
            <YStack
              flex={1}
              height={2}
              backgroundColor="$primary"
              marginHorizontal={4}
              maxWidth={60}
            />
            <YStack
              width={28}
              height={28}
              borderRadius={14}
              alignItems="center"
              justifyContent="center"
              backgroundColor={selectedFacility ? '$primary' : '$surfaceElevated'}
            >
              <Text
                fontSize={12}
                fontWeight="700"
                color={selectedFacility ? '$background' : '$textTertiary'}
                letterSpacing={-0.2}
              >
                2
              </Text>
            </YStack>
            <YStack
              flex={1}
              height={2}
              backgroundColor="$surfaceElevated"
              marginHorizontal={4}
              maxWidth={60}
            />
            <YStack
              width={28}
              height={28}
              borderRadius={14}
              alignItems="center"
              justifyContent="center"
              backgroundColor="$surfaceElevated"
            >
              <Text fontSize={12} fontWeight="700" color="$textTertiary" letterSpacing={-0.2}>
                3
              </Text>
            </YStack>
          </XStack>
          <XStack justifyContent="space-between" marginTop={6} paddingHorizontal={4}>
            <Text
              fontSize={11}
              fontWeight="600"
              color="$textPrimary"
              letterSpacing={-0.2}
              textAlign="center"
              width={60}
            >
              시설 선택
            </Text>
            <Text
              fontSize={11}
              fontWeight="600"
              color={selectedFacility ? '$textPrimary' : '$textTertiary'}
              letterSpacing={-0.2}
              textAlign="center"
              width={60}
            >
              정보 입력
            </Text>
            <Text
              fontSize={11}
              fontWeight="600"
              color="$textTertiary"
              letterSpacing={-0.2}
              textAlign="center"
              width={60}
            >
              결과 확인
            </Text>
          </XStack>
        </Animated.View>

        {/* ── 브랜드 ───────────────────────────────── */}
        <Animated.View
          entering={stagger(2)}
          style={{ paddingHorizontal: Layout.screenPadding, marginTop: 20 }}
        >
          <Text
            fontSize={28}
            fontWeight="800"
            fontStyle="italic"
            color="$textPrimary"
            letterSpacing={-1.8}
          >
            Ujuz
          </Text>
          <Text
            fontSize={22}
            fontWeight="600"
            color="$textPrimary"
            letterSpacing={-0.8}
            lineHeight={32}
            marginTop={8}
          >
            이 어린이집에 내 아이가{'\n'}들어갈 수 있을까?
          </Text>
        </Animated.View>

        {/* ── 어린이집 검색 ────────────────────────── */}
        <Animated.View
          entering={stagger(3)}
          style={{ paddingHorizontal: Layout.screenPadding, marginTop: 20 }}
        >
          <Text
            fontSize={14}
            fontWeight="700"
            color="$textPrimary"
            letterSpacing={-0.3}
            marginBottom={10}
          >
            어린이집 선택
          </Text>

          {selectedFacility ? (
            <TamaguiPressableScale hapticType="light" onPress={handleClearFacility}>
              <XStack
                backgroundColor="$surface"
                borderRadius={12}
                borderWidth={0.5}
                borderColor="$borderColor"
                padding={16}
                alignItems="center"
                justifyContent="space-between"
              >
                <YStack flex={1}>
                  <Text
                    fontSize={15}
                    fontWeight="600"
                    color="$textPrimary"
                    letterSpacing={-0.3}
                  >
                    {selectedFacility.name}
                  </Text>
                  <Text
                    fontSize={12}
                    fontWeight="400"
                    color="$textTertiary"
                    letterSpacing={-0.1}
                    marginTop={2}
                  >
                    {selectedFacility.address}
                  </Text>
                </YStack>
                <Text fontSize={13} fontWeight="600" color="$primary" letterSpacing={-0.2}>
                  변경
                </Text>
              </XStack>
            </TamaguiPressableScale>
          ) : (
            <YStack>
              <TamaguiInput
                variant="search"
                placeholder="어린이집 이름 검색"
                value={searchQuery}
                onChangeText={handleSearch}
              />

              {searchResults.length > 0 && (
                <YStack
                  marginTop={4}
                  backgroundColor="$surface"
                  borderRadius={12}
                  borderWidth={0.5}
                  borderColor="$borderColor"
                  overflow="hidden"
                >
                  {searchResults.map((place) => (
                    <TamaguiPressableScale
                      key={place.id}
                      hapticType="light"
                      onPress={() => handleSelectFacility(place)}
                    >
                      <YStack
                        paddingHorizontal={16}
                        paddingVertical={12}
                        borderBottomWidth={0.5}
                        borderBottomColor="$borderColor"
                      >
                        <Text
                          fontSize={14}
                          fontWeight="600"
                          color="$textPrimary"
                          letterSpacing={-0.2}
                        >
                          {place.name}
                        </Text>
                        <Text
                          fontSize={12}
                          fontWeight="400"
                          color="$textTertiary"
                          letterSpacing={-0.1}
                          marginTop={2}
                        >
                          {place.address}
                        </Text>
                      </YStack>
                    </TamaguiPressableScale>
                  ))}
                </YStack>
              )}
            </YStack>
          )}
        </Animated.View>

        {/* ── 아이 정보 (자동 반영) ─────────────────── */}
        <Animated.View
          entering={stagger(4)}
          style={{ paddingHorizontal: Layout.screenPadding, marginTop: 20 }}
        >
          <Text
            fontSize={14}
            fontWeight="700"
            color="$textPrimary"
            letterSpacing={-0.3}
            marginBottom={10}
          >
            아이 정보
          </Text>
          <YStack
            backgroundColor="$surface"
            borderRadius={16}
            borderWidth={0.5}
            borderColor="$borderColor"
            paddingHorizontal={18}
            paddingVertical={12}
          >
            <InfoRow label="이름" value={childName} />
            <InfoRow label="생년월일" value={childBirthDate} />
            <InfoRow label="월령" value={`${getChildAgeMonths()}개월`} />
            <InfoRow label="연령반" value={ageLabel} />
          </YStack>
        </Animated.View>

        {/* ── 희망 연령반 ───────────────────────────── */}
        <Animated.View
          entering={stagger(4)}
          style={{ paddingHorizontal: Layout.screenPadding, marginTop: 20 }}
        >
          <Text
            fontSize={14}
            fontWeight="700"
            color="$textPrimary"
            letterSpacing={-0.3}
            marginBottom={10}
          >
            희망 연령반
          </Text>
          <TamaguiChipGroup>
            {AGE_CLASSES.map((cls) => (
              <TamaguiChip
                key={cls}
                label={cls}
                selected={selectedClass === cls}
                onPress={() => setSelectedClass(cls)}
                size="sm"
              />
            ))}
          </TamaguiChipGroup>
        </Animated.View>

        {/* ── 우선순위 유형 ─────────────────────────── */}
        <Animated.View
          entering={stagger(5)}
          style={{ paddingHorizontal: Layout.screenPadding, marginTop: 20 }}
        >
          <Text
            fontSize={14}
            fontWeight="700"
            color="$textPrimary"
            letterSpacing={-0.3}
            marginBottom={10}
          >
            입소 우선순위
          </Text>
          <TamaguiChipGroup>
            {PRIORITY_OPTIONS.map(({ value, label }) => (
              <TamaguiChip
                key={value}
                label={label}
                selected={selectedPriority === value}
                onPress={() => setSelectedPriority(value)}
                size="sm"
              />
            ))}
          </TamaguiChipGroup>
        </Animated.View>

        {/* ── 추가 우선순위 ─────────────────────────── */}
        <Animated.View
          entering={stagger(6)}
          style={{ paddingHorizontal: Layout.screenPadding, marginTop: 20 }}
        >
          <Text
            fontSize={14}
            fontWeight="700"
            color="$textPrimary"
            letterSpacing={-0.3}
            marginBottom={10}
          >
            추가 우선순위
          </Text>
          <Text
            fontSize={12}
            fontWeight="400"
            color="$textTertiary"
            letterSpacing={-0.2}
            marginBottom={10}
            marginTop={-4}
          >
            해당하는 항목을 모두 선택하세요
          </Text>
          <TamaguiChipGroup>
            {filteredAdditional.map(({ value, label }) => (
              <TamaguiChip
                key={value}
                label={label}
                selected={additionalPriorities.includes(value)}
                onPress={() => toggleAdditional(value)}
                size="sm"
                leftIcon={additionalPriorities.includes(value) ? 'checkmark' : undefined}
              />
            ))}
          </TamaguiChipGroup>
        </Animated.View>

        {/* ── 무료 횟수 초과 시 프리미엄 게이트 ──── */}
        {!canUse && (
          <Animated.View
            entering={stagger(7)}
            style={{ paddingHorizontal: Layout.screenPadding, marginTop: 20 }}
          >
            <PremiumGate
              visible
              inline
              onUpgradePress={() => navigation.navigate('Subscription')}
            >
              <></>
            </PremiumGate>
          </Animated.View>
        )}

        {/* ── CTA 버튼 ─────────────────────────────── */}
        <Animated.View
          entering={stagger(8)}
          style={{ paddingHorizontal: Layout.screenPadding, marginTop: 20 }}
        >
          <TamaguiPressableScale
            hapticType="medium"
            onPress={handleCalculate}
            disabled={!selectedFacility || isCalculating || !canUse}
            accessibilityLabel="입학 가능성 확인하기"
            accessibilityHint="입학 가능성을 분석합니다"
          >
            <YStack
              backgroundColor="$primary"
              borderRadius={14}
              paddingVertical={16}
              alignItems="center"
              justifyContent="center"
              marginTop={8}
            >
              {isCalculating ? (
                <ActivityIndicator color={theme.background.val} size="small" />
              ) : (
                <Text fontSize={15} fontWeight="600" color="$background" letterSpacing={-0.3}>
                  입학 가능성 확인하기
                </Text>
              )}
            </YStack>
          </TamaguiPressableScale>

          <Text
            fontSize={11}
            fontWeight="400"
            color="$textTertiary"
            letterSpacing={-0.1}
            textAlign="center"
            marginTop={10}
          >
            대기 현황 및 지역 경쟁률 기반 예측 결과입니다
          </Text>
        </Animated.View>

        {/* ── 쿼타 바 ──────────────────────────────── */}
        {totalLimit > 0 && (
          <Animated.View
            entering={stagger(9)}
            style={{ paddingHorizontal: Layout.screenPadding, marginTop: 24 }}
          >
            <QuotaBar
              label="입학조회"
              used={totalLimit - remaining}
              total={totalLimit}
              iconName="school-outline"
              showUpgradeCta={!canUse}
              onUpgradePress={() => navigation.navigate('Subscription')}
            />
          </Animated.View>
        )}
      </ScrollView>
    </YStack>
  );
}

// ─── Sub-components ────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical={6}>
      <Text fontSize={13} fontWeight="400" color="$textTertiary" letterSpacing={-0.2}>
        {label}
      </Text>
      <Text fontSize={14} fontWeight="600" color="$textPrimary" letterSpacing={-0.2}>
        {value}
      </Text>
    </XStack>
  );
}

export default AdmissionScoreScreen;

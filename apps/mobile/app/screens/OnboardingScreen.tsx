/**
 * OnboardingScreen - Mobile-only onboarding
 * Design System: TamaguiText, TamaguiChip, TamaguiPressableScale
 *
 * 2026 UJUz 테마 토큰 기반
 */

import { useMemo, useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'tamagui';
import { Colors, Layout } from '@/app/constants';
import { useProfileStore } from '@/app/stores/profileStore';
import { useOnboardingStore } from '@/app/stores/onboardingStore';
import type { RootStackNavigationProp } from '@/app/types/navigation';
import {
  TamaguiText,
  TamaguiChip,
  TamaguiChipGroup,
  TamaguiPressableScale,
} from '@/app/design-system';

const AGE_OPTIONS = [
  { label: '0-6m', months: 4 },
  { label: '6-12m', months: 9 },
  { label: '1-2y', months: 18 },
  { label: '2-4y', months: 36 },
  { label: '4-6y', months: 54 },
];

const PREFERENCE_OPTIONS = [
  { key: 'indoor', label: '실내' },
  { key: 'outdoor', label: '야외' },
  { key: 'mixed', label: '균형' },
] as const;

const BUDGET_OPTIONS = [
  { key: 'low', label: '가성비' },
  { key: 'mid', label: '보통' },
  { key: 'high', label: '프리미엄' },
] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useTheme();
  const { setChildName, setChildBirthDate } = useProfileStore();
  const {
    setHasOnboarded,
    preferredRegion,
    setPreferredRegion,
    childPreference,
    setChildPreference,
    budgetPreference,
    setBudgetPreference,
    travelRadiusKm,
    setTravelRadiusKm,
  } = useOnboardingStore();

  const [childNameInput, setChildNameInput] = useState('우리 아이');
  const [ageMonths, setAgeMonths] = useState<number>(36);

  const computedBirthDate = useMemo(() => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    target.setMonth(target.getMonth() - ageMonths);
    return target.toISOString().slice(0, 10);
  }, [ageMonths]);

  const handleContinue = () => {
    setChildName(childNameInput);
    setChildBirthDate(computedBirthDate);
    setHasOnboarded(true);
    navigation.replace('Permissions');
  };

  const styles = useMemo(
    () => ({
      container: {
        flex: 1 as const,
        backgroundColor: theme.background.val,
      },
      header: {
        paddingHorizontal: Layout.screenPadding,
        marginBottom: 24,
      },
      logo: {
        fontStyle: 'italic' as const,
        letterSpacing: -1.2,
        marginBottom: 10,
      },
      subtitleMargin: {
        marginTop: 6,
      },
      card: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.surface.val,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      },
      sectionLabelMargin: {
        marginBottom: 10,
      },
      sectionLabelMarginTop: {
        marginTop: 16,
        marginBottom: 10,
      },
      input: {
        height: 44,
        backgroundColor: theme.surfaceElevated.val,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: 14,
        color: theme.textPrimary.val,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      },
      cta: {
        marginTop: 20,
        marginHorizontal: 20,
        height: 52,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
    }),
    [theme]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <TamaguiText preset="h1" textColor="primary" weight="bold" style={styles.logo}>
          uju
        </TamaguiText>
        <TamaguiText preset="h3" textColor="primary" weight="bold">
          아이에게 맞는 하루를 시작해요
        </TamaguiText>
        <TamaguiText preset="caption" textColor="secondary" style={styles.subtitleMargin}>
          Trust → Recommend → Execute
        </TamaguiText>
      </View>

      <View style={styles.card}>
        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.sectionLabelMargin}
        >
          아이 이름
        </TamaguiText>
        <TextInput
          value={childNameInput}
          onChangeText={setChildNameInput}
          placeholder="아이 이름"
          placeholderTextColor={theme.textTertiary.val}
          style={styles.input}
          accessibilityLabel="아이 이름"
          accessibilityHint="아이의 이름을 입력하세요"
        />

        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.sectionLabelMarginTop}
        >
          아이 연령
        </TamaguiText>
        <TamaguiChipGroup gap={8}>
          {AGE_OPTIONS.map((opt) => (
            <TamaguiChip
              key={opt.label}
              label={opt.label}
              selected={ageMonths === opt.months}
              onPress={() => setAgeMonths(opt.months)}
              variant="soft"
              size="md"
            />
          ))}
        </TamaguiChipGroup>

        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.sectionLabelMarginTop}
        >
          선호 환경
        </TamaguiText>
        <TamaguiChipGroup gap={8}>
          {PREFERENCE_OPTIONS.map((opt) => (
            <TamaguiChip
              key={opt.key}
              label={opt.label}
              selected={childPreference === opt.key}
              onPress={() => setChildPreference(opt.key)}
              variant="soft"
              size="md"
            />
          ))}
        </TamaguiChipGroup>

        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.sectionLabelMarginTop}
        >
          예산 감도
        </TamaguiText>
        <TamaguiChipGroup gap={8}>
          {BUDGET_OPTIONS.map((opt) => (
            <TamaguiChip
              key={opt.key}
              label={opt.label}
              selected={budgetPreference === opt.key}
              onPress={() => setBudgetPreference(opt.key)}
              variant="soft"
              size="md"
            />
          ))}
        </TamaguiChipGroup>

        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.sectionLabelMarginTop}
        >
          이동 거리 (km)
        </TamaguiText>
        <TamaguiChipGroup gap={8}>
          {[3, 5, 8, 12].map((value) => (
            <TamaguiChip
              key={value}
              label={`${value}km`}
              selected={travelRadiusKm === value}
              onPress={() => setTravelRadiusKm(value)}
              variant="soft"
              size="md"
            />
          ))}
        </TamaguiChipGroup>

        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.sectionLabelMarginTop}
        >
          기본 지역
        </TamaguiText>
        <TextInput
          value={preferredRegion}
          onChangeText={setPreferredRegion}
          placeholder="예) 서울, 판교"
          placeholderTextColor={theme.textTertiary.val}
          style={styles.input}
          accessibilityLabel="기본 지역"
          accessibilityHint="선호하는 지역을 입력하세요"
        />
      </View>

      <TamaguiPressableScale
        onPress={handleContinue}
        hapticType="medium"
        style={styles.cta}
        accessibilityLabel="다음 버튼"
        accessibilityHint="다음 단계로 이동합니다"
      >
        <TamaguiText preset="bodyLarge" textColor="inverse" weight="bold">
          다음
        </TamaguiText>
      </TamaguiPressableScale>
    </ScrollView>
  );
}

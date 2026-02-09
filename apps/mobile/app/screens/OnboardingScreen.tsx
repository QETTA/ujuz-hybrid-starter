/**
 * OnboardingScreen - 모바일 전용 온보딩
 * Design System: TamaguiText, TamaguiChip, TamaguiPressableScale
 *
 * 2026 UJUz 테마 토큰 기반
 */

import { useMemo, useState } from 'react';
import { TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  { label: '0~6개월', months: 4 },
  { label: '6~12개월', months: 9 },
  { label: '1~2세', months: 18 },
  { label: '2~4세', months: 36 },
  { label: '4~6세', months: 54 },
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
      gradient: {
        flex: 1 as const,
      },
      header: {
        paddingHorizontal: Layout.screenPadding,
        marginBottom: 28,
      },
      logo: {
        fontStyle: 'italic' as const,
        letterSpacing: -1.4,
        fontSize: 36,
        fontWeight: '800' as const,
        marginBottom: 12,
      },
      title: {
        fontSize: 30,
        fontWeight: '800' as const,
        lineHeight: 40,
      },
      subtitleMargin: {
        marginTop: 8,
      },
      card: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 20,
        backgroundColor: theme.surface.val,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      },
      sectionLabelMargin: {
        marginBottom: 10,
      },
      sectionLabelMarginTop: {
        marginTop: 18,
        marginBottom: 10,
      },
      input: {
        height: 48,
        backgroundColor: theme.surfaceElevated.val,
        borderRadius: 14,
        paddingHorizontal: 14,
        fontSize: 15,
        color: theme.textPrimary.val,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      },
      cta: {
        marginTop: 24,
        marginHorizontal: 20,
        height: 56,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
    }),
    [theme]
  );

  return (
    <LinearGradient
      colors={[theme.background.val, theme.surface.val, theme.background.val]}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.header} entering={FadeInDown.duration(500)}>
          <TamaguiText preset="h1" textColor="primary" weight="bold" style={styles.logo}>
            우쥬
          </TamaguiText>
          <TamaguiText preset="h3" textColor="primary" weight="bold" style={styles.title}>
            아이에게 맞는 하루를{'\n'}시작해요
          </TamaguiText>
          <TamaguiText preset="caption" textColor="secondary" style={styles.subtitleMargin}>
            오늘 갈 곳·입학·대기 알림까지
          </TamaguiText>
        </Animated.View>

        <Animated.View style={styles.card} entering={FadeInDown.delay(200).duration(500)}>
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
          이동 거리
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
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
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
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

/**
 * FeedbackScreen - Post-visit feedback
 * Design System: TamaguiText, TamaguiPressableScale, TamaguiHeader
 *
 * 2026 UJUz 테마 토큰 기반
 */

import { useState, useMemo } from 'react';
import { View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale, TamaguiHeader } from '@/app/design-system';
import { useToast } from '@/app/components/shared/Toast';
import type { RootStackNavigationProp } from '@/app/types/navigation';

const RATINGS = [1, 2, 3, 4, 5];

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useTheme();
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');

  const { showToast } = useToast();

  const handleSubmit = () => {
    showToast({ type: 'success', message: '후기가 반영되었어요.' });
    navigation.goBack();
  };

  const styles = useMemo(
    () => ({
      container: {
        flex: 1 as const,
        backgroundColor: theme.background.val,
        paddingHorizontal: Layout.screenPadding,
      },
      card: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.surface.val,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      },
      label: {
        marginBottom: 10,
      },
      labelTop: {
        marginTop: 16,
        marginBottom: 10,
      },
      ratingRow: {
        flexDirection: 'row' as const,
        gap: 6,
      },
      textArea: {
        minHeight: 120,
        backgroundColor: theme.surfaceElevated.val,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.textPrimary.val,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      },
      cta: {
        marginTop: 16,
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
    <View style={[styles.container, { paddingTop: insets.top + 56 }]}>
      <TamaguiHeader
        title="후기 남기기"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.card}>
        <TamaguiText preset="caption" textColor="secondary" weight="semibold" style={styles.label}>
          만족도
        </TamaguiText>
        <View style={styles.ratingRow}>
          {RATINGS.map((value) => (
            <TamaguiPressableScale
              key={value}
              onPress={() => setRating(value)}
              accessibilityLabel={`${value}점`}
              accessibilityHint={value <= rating ? '선택됨' : '선택되지 않음'}
            >
              <Ionicons
                name={value <= rating ? 'star' : 'star-outline'}
                size={26}
                color={value <= rating ? Colors.ratingStar : theme.textTertiary.val}
              />
            </TamaguiPressableScale>
          ))}
        </View>

        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.labelTop}
        >
          메모
        </TamaguiText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="아이에게 어떤 점이 좋았나요?"
          placeholderTextColor={theme.textTertiary.val}
          style={styles.textArea}
          multiline
        />
      </View>

      <TamaguiPressableScale
        onPress={handleSubmit}
        hapticType="medium"
        style={styles.cta}
        accessibilityLabel="제출 버튼"
        accessibilityHint="후기를 제출합니다"
      >
        <TamaguiText preset="bodyLarge" textColor="inverse" weight="bold">
          제출
        </TamaguiText>
      </TamaguiPressableScale>
    </View>
  );
}

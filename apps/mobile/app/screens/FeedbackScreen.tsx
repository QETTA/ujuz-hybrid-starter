/**
 * FeedbackScreen - Post-visit feedback
 * Design System: TamaguiText, TamaguiPressableScale
 */

import { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { useToast } from '@/app/components/shared/Toast';
import type { RootStackNavigationProp } from '@/app/types/navigation';

const RATINGS = [1, 2, 3, 4, 5];

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');

  const { showToast } = useToast();

  const handleSubmit = () => {
    showToast({ type: 'success', message: '후기가 반영되었어요.' });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TamaguiPressableScale
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={20} color={Colors.darkTextPrimary} />
        </TamaguiPressableScale>
        <TamaguiText preset="h3" textColor="primary" weight="bold">
          후기 남기기
        </TamaguiText>
        <View style={{ width: 36 }} />
      </View>

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
                color={value <= rating ? Colors.ratingStar : Colors.darkTextTertiary}
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
          placeholderTextColor={Colors.darkTextTertiary}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    paddingHorizontal: Layout.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 18,
    backgroundColor: Colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.darkSurface,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  label: {
    marginBottom: 10,
  },
  labelTop: {
    marginTop: 16,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 6,
  },
  textArea: {
    minHeight: 120,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.darkTextPrimary,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  cta: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * ReportScreen - Report / correction form
 * Design System: TamaguiText, TamaguiChip, TamaguiChipGroup, TamaguiPressableScale
 */

import { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout } from '@/app/constants';
import {
  TamaguiText,
  TamaguiChip,
  TamaguiChipGroup,
  TamaguiPressableScale,
} from '@/app/design-system';
import { useToast } from '@/app/components/shared/Toast';
import type { RootStackNavigationProp } from '@/app/types/navigation';

const REASONS = ['정보 오류', '가격/딜', '운영 시간', '시설/안전', '기타'];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const [reason, setReason] = useState(REASONS[0]);
  const [message, setMessage] = useState('');

  const { showToast } = useToast();

  const handleSubmit = () => {
    showToast({ type: 'success', message: '정정 요청을 접수했어요.' });
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
          정보 정정
        </TamaguiText>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.card}>
        <TamaguiText preset="caption" textColor="secondary" weight="semibold" style={styles.label}>
          사유
        </TamaguiText>
        <TamaguiChipGroup gap={8}>
          {REASONS.map((item) => (
            <TamaguiChip
              key={item}
              label={item}
              selected={reason === item}
              onPress={() => setReason(item)}
              variant="soft"
              size="sm"
            />
          ))}
        </TamaguiChipGroup>

        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.labelTop}
        >
          내용
        </TamaguiText>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="수정이 필요한 내용을 알려주세요"
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
        accessibilityHint="정정 요청을 제출합니다"
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

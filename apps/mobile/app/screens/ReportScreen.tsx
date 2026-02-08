/**
 * ReportScreen - Report / correction form
 * Design System: TamaguiText, TamaguiChip, TamaguiChipGroup, TamaguiPressableScale
 *
 * 2026 UJUz 테마 토큰 기반
 */

import { useMemo } from 'react';
import { View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Colors, Layout } from '@/app/constants';
import {
  TamaguiText,
  TamaguiChip,
  TamaguiChipGroup,
  TamaguiPressableScale,
  TamaguiHeader,
} from '@/app/design-system';
import { useToast } from '@/app/components/shared/Toast';
import type { RootStackNavigationProp } from '@/app/types/navigation';

const REASONS = ['정보 오류', '가격/딜', '운영 시간', '시설/안전', '기타'];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useTheme();
  const [reason, setReason] = useState(REASONS[0]);
  const [message, setMessage] = useState('');

  const { showToast } = useToast();

  const handleSubmit = () => {
    showToast({ type: 'success', message: '정정 요청을 접수했어요.' });
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
        title="정보 정정"
        showBack
        onBack={() => navigation.goBack()}
      />

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
        accessibilityHint="정정 요청을 제출합니다"
      >
        <TamaguiText preset="bodyLarge" textColor="inverse" weight="bold">
          제출
        </TamaguiText>
      </TamaguiPressableScale>
    </View>
  );
}

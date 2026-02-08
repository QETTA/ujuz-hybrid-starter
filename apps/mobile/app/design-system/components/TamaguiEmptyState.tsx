/**
 * TamaguiEmptyState - Empty State Component
 *
 * 2026 Design System: 빈 상태 표시
 * - 아이콘 + 제목 + 메시지 + 액션 버튼
 * - Light/Dark 모드 자동 지원
 * - 완벽한 접근성 지원
 */

import { YStack, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TamaguiText } from './TamaguiText';
import TamaguiButton from './TamaguiButton';

export interface TamaguiEmptyStateProps {
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Title text */
  title: string;
  /** Description message */
  message?: string;
  /** Action button configuration */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Test ID for testing */
  testID?: string;
}

export function TamaguiEmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  action,
  testID,
}: TamaguiEmptyStateProps) {
  const theme = useTheme();
  const accessibilityLabel = message ? `${title}. ${message}` : title;

  const handleAction = () => {
    if (action) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      action.onPress();
    }
  };

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$6"
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="No content to display"
    >
      <Ionicons
        name={icon}
        size={80}
        color={theme.textTertiary.val}
        style={{ marginBottom: 28 }}
        accessibilityElementsHidden={true}
      />

      <TamaguiText preset="h3" textColor="secondary" textAlign="center" marginBottom="$2">
        {title}
      </TamaguiText>

      {message && (
        <TamaguiText preset="body" textColor="tertiary" textAlign="center" marginBottom="$4">
          {message}
        </TamaguiText>
      )}

      {action && (
        <TamaguiButton variant="primary" size="md" onPress={handleAction}>
          {action.label}
        </TamaguiButton>
      )}
    </YStack>
  );
}

export default TamaguiEmptyState;

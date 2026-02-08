/**
 * TamaguiErrorView - Error State Component
 *
 * 2026 Design System: 에러 상태 표시
 * - 아이콘 + 제목 + 메시지 + 재시도 버튼
 * - Light/Dark 모드 자동 지원
 * - Haptic 피드백
 * - 완벽한 접근성 지원
 */

import { YStack, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TamaguiText } from './TamaguiText';
import TamaguiButton from './TamaguiButton';
import { COPY } from '@/app/copy/copy.ko';

export interface TamaguiErrorViewProps {
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Custom icon */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Test ID for testing */
  testID?: string;
}

export function TamaguiErrorView({
  title = COPY.ERROR_TITLE,
  message = COPY.ERROR_MSG,
  onRetry,
  icon = 'alert-circle-outline',
  testID,
}: TamaguiErrorViewProps) {
  const theme = useTheme();

  const handleRetry = () => {
    if (onRetry) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onRetry();
    }
  };

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$6"
      backgroundColor="$background"
      testID={testID}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${message}`}
    >
      <Ionicons
        name={icon}
        size={64}
        color={theme.error.val}
        style={{ marginBottom: 20 }}
        accessibilityElementsHidden={true}
      />

      <TamaguiText preset="h3" textColor="primary" textAlign="center" marginBottom="$2">
        {title}
      </TamaguiText>

      <TamaguiText preset="bodyLarge" textColor="tertiary" textAlign="center" marginBottom="$6">
        {message}
      </TamaguiText>

      {onRetry && (
        <TamaguiButton variant="primary" size="md" onPress={handleRetry}>
          {COPY.RETRY}
        </TamaguiButton>
      )}
    </YStack>
  );
}

export default TamaguiErrorView;

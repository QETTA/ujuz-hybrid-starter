/**
 * TamaguiLoadingSpinner - Inline Loading Spinner
 *
 * 2026 Design System: 인라인 로딩 스피너
 * - 컴포넌트 내부에서 사용하는 작은 로딩 인디케이터
 * - Light/Dark 모드 자동 지원
 */

import { Spinner, YStack } from 'tamagui';
import { TamaguiText } from './TamaguiText';

export interface TamaguiLoadingSpinnerProps {
  /** Spinner size */
  size?: 'small' | 'large';
  /** Spinner color (theme token) */
  color?: string;
  /** Optional loading message */
  message?: string;
  /** Test ID for testing */
  testID?: string;
}

export function TamaguiLoadingSpinner({
  size = 'small',
  color = '$primary',
  message,
  testID,
}: TamaguiLoadingSpinnerProps) {
  return (
    <YStack
      padding="$4"
      alignItems="center"
      justifyContent="center"
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading'}
    >
      <Spinner size={size} color={color} />
      {message && (
        <TamaguiText preset="caption" textColor="tertiary" marginTop="$3" textAlign="center">
          {message}
        </TamaguiText>
      )}
    </YStack>
  );
}

export default TamaguiLoadingSpinner;

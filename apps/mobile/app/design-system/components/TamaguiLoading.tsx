/**
 * TamaguiLoading - Full Screen Loading Component
 *
 * 2026 Design System: 전체 화면 로딩 상태
 * - Tamagui Spinner + TamaguiText 조합
 * - Light/Dark 모드 자동 지원
 * - 접근성 완벽 지원
 */

import { Spinner, YStack } from 'tamagui';
import { TamaguiText } from './TamaguiText';

export interface TamaguiLoadingProps {
  /** Loading message */
  message?: string;
  /** Spinner size */
  size?: 'small' | 'large';
  /** Test ID for testing */
  testID?: string;
}

export function TamaguiLoading({ message, size = 'large', testID }: TamaguiLoadingProps) {
  const accessibilityLabel = message ? `Loading. ${message}` : 'Loading';

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$6"
      testID={testID}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Please wait while content loads"
    >
      <Spinner size={size} color="$primary" accessibilityElementsHidden={true} />
      {message && (
        <TamaguiText preset="body" textColor="secondary" marginTop="$4" textAlign="center">
          {message}
        </TamaguiText>
      )}
    </YStack>
  );
}

export default TamaguiLoading;

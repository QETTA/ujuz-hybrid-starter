/**
 * ErrorView - iOS 26 Style
 *
 * Error state display with retry action
 */

import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

interface ErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function ErrorView({
  title = COPY.ERROR_TITLE,
  message = COPY.ERROR_MSG,
  onRetry,
  icon = 'alert-circle-outline',
}: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.iosSystemRed} style={styles.icon} />
      <TamaguiText preset="h3" textColor="primary" weight="semibold" style={styles.title}>
        {title}
      </TamaguiText>
      <TamaguiText preset="body" textColor="tertiary" style={styles.message}>
        {message}
      </TamaguiText>
      {onRetry && (
        <TamaguiPressableScale
          style={styles.retryButton}
          onPress={onRetry}
          hapticType="light"
          accessibilityLabel={COPY.A11Y_RETRY}
          accessibilityHint={COPY.A11Y_RETRY_HINT}
        >
          <TamaguiText preset="body" textColor="inverse" weight="semibold" style={styles.retryText}>
            {COPY.RETRY}
          </TamaguiText>
        </TamaguiPressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.darkBg,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.darkTextPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 17,
    color: Colors.darkTextTertiary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkBg,
  },
});

/**
 * Retry Wrapper Component
 * Provides retry functionality for failed operations
 */

import { useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

interface RetryWrapperProps {
  onRetry: () => Promise<void> | void;
  error: Error | null;
  isLoading?: boolean;
  children: ReactNode;
  maxRetries?: number;
}

export function RetryWrapper({
  onRetry,
  error,
  isLoading = false,
  children,
  maxRetries = 3,
}: RetryWrapperProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount, maxRetries]);

  if (error && !isLoading && !isRetrying) {
    const canRetry = retryCount < maxRetries;

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.iosSystemOrange} />
          <TamaguiText preset="h3" textColor="primary" weight="semibold" style={styles.title}>
            {COPY.CONNECTION_ERROR}
          </TamaguiText>
          <TamaguiText preset="body" textColor="tertiary" style={styles.message}>
            {error.message}
          </TamaguiText>

          {canRetry && (
            <TamaguiPressableScale
              style={styles.retryButton}
              onPress={handleRetry}
              hapticType="light"
              accessibilityLabel={COPY.RETRY_LABEL(retryCount, maxRetries)}
              accessibilityHint={COPY.A11Y_RETRY_REQUEST}
            >
              <Ionicons name="refresh" size={20} color={Colors.link} style={styles.retryIcon} />
              <TamaguiText preset="body" weight="medium" style={styles.retryText}>
                {COPY.RETRY_LABEL(retryCount, maxRetries)}
              </TamaguiText>
            </TamaguiPressableScale>
          )}

          {!canRetry && (
            <TamaguiText preset="body" style={styles.maxRetriesText}>
              {COPY.MAX_RETRY_MSG}
            </TamaguiText>
          )}
        </View>
      </View>
    );
  }

  if (isRetrying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.link} />
        <TamaguiText preset="body" textColor="tertiary" style={styles.retryingText}>
          {COPY.RETRYING}
        </TamaguiText>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.iosLabel,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.iosSecondaryBackground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.link,
  },
  maxRetriesText: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.iosSystemRed,
    textAlign: 'center',
  },
  retryingText: {
    fontSize: 17,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
    marginTop: 16,
  },
});

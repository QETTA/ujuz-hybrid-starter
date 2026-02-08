/**
 * LoadingOverlay - iOS 26 Style
 *
 * Full-screen loading overlay with iOS-style blur effect (UIBlurEffect)
 */

import { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from 'tamagui';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText } from '@/app/design-system';

interface LoadingOverlayProps {
  message?: string;
  visible?: boolean;
}

export default function LoadingOverlay({ message, visible = true }: LoadingOverlayProps) {
  const theme = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: Colors.overlayDark,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    container: {
      backgroundColor: theme.surface.val,
      borderRadius: 16,
      padding: 24,
      minWidth: 120,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: theme.borderColor.val,
    },
    message: {
      marginTop: 16,
      fontSize: 17,
      color: theme.textPrimary.val,
      textAlign: 'center',
    },
  }), [theme]);

  if (!visible) return null;

  const accessibilityLabel = message ? `처리 중. ${message}` : '처리 중입니다';

  const content = (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={Colors.primary}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      />
      {message && (
        <TamaguiText preset="body" textColor="primary" style={styles.message}>
          {message}
        </TamaguiText>
      )}
    </View>
  );

  // iOS: Use native blur effect (UIBlurEffect style)
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        style={styles.overlay}
        intensity={20}
        tint="dark"
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={accessibilityLabel}
        accessibilityViewIsModal={true}
        accessibilityLiveRegion="assertive"
      >
        {content}
      </BlurView>
    );
  }

  // Android: Use semi-transparent overlay
  return (
    <View
      style={styles.overlay}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel}
      accessibilityViewIsModal={true}
      accessibilityLiveRegion="assertive"
    >
      {content}
    </View>
  );
}

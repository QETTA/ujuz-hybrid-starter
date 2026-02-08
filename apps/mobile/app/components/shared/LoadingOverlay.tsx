/**
 * LoadingOverlay - iOS 26 Style
 *
 * Full-screen loading overlay with iOS-style blur effect (UIBlurEffect)
 */

import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText } from '@/app/design-system';

interface LoadingOverlayProps {
  message?: string;
  visible?: boolean;
}

export default function LoadingOverlay({ message, visible = true }: LoadingOverlayProps) {
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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    padding: 24,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  message: {
    marginTop: 16,
    fontSize: 17,
    color: Colors.darkTextPrimary,
    textAlign: 'center',
  },
});

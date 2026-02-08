/**
 * LoadingSpinner - iOS 26 Style
 *
 * Inline loading spinner for use within components
 */

import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText } from '@/app/design-system';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
}

export default function LoadingSpinner({
  size = 'small',
  color = Colors.link,
  message,
  style,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <TamaguiText preset="body" textColor="tertiary" style={styles.message}>
          {message}
        </TamaguiText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.iosTertiaryLabel,
    textAlign: 'center',
  },
});

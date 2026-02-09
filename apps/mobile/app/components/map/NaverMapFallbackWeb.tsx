/**
 * Web Fallback Map View
 * Naver Map SDK는 네이티브 전용이므로 웹에서는 폴백 표시
 */
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText } from '@/app/design-system';

export default function NaverMapFallbackWeb() {
  return (
    <View style={styles.root}>
      <TamaguiText preset="body" textColor="tertiary">
        Map is not available on web.
      </TamaguiText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tossGray50,
  },
});

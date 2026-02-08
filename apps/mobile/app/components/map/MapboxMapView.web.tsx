import { View, StyleSheet } from 'react-native';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText } from '@/app/design-system';

export type MapLngLat = { lng: number; lat: number };

// Minimal stub for Expo Web (Mapbox native SDK isn't supported in Expo Web builds)
export default function MapboxMapViewWeb() {
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

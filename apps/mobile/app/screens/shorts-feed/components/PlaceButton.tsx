/**
 * PlaceButton Component
 *
 * CTA button to visit the related place on the map
 */

import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants/Colors';
import { COPY } from '@/app/copy/copy.ko';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';

interface PlaceButtonProps {
  placeName: string;
  distance: number;
  onPress: () => void;
}

export function PlaceButton({ placeName, distance, onPress }: PlaceButtonProps) {
  const distanceText =
    distance < 1000
      ? COPY.DISTANCE_M(Math.round(distance))
      : COPY.DISTANCE_KM((distance / 1000).toFixed(1));

  return (
    <TamaguiPressableScale
      style={styles.container}
      onPress={onPress}
      hapticType="light"
      accessibilityLabel={`${placeName} 방문, ${distanceText}`}
      accessibilityHint={COPY.A11Y_NAVIGATE_PLACE}
    >
      <View style={styles.content}>
        <View>
          <TamaguiText preset="body" textColor="primary" weight="semibold" style={styles.title}>
            {placeName}
          </TamaguiText>
          <TamaguiText preset="body" textColor="tertiary">
            {distanceText}
          </TamaguiText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.link}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      </View>
    </TamaguiPressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glassLight,
    borderRadius: 12,
    padding: 14,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.iosLabel,
    marginBottom: 2,
  },
  distance: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
  },
});

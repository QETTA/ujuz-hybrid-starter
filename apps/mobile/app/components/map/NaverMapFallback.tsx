/**
 * Expo Go Fallback Map View
 * Development Build가 아닌 환경에서 사용되는 폴백 리스트 UI
 */
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import type { MapViewProps } from './types';

/**
 * Fallback map for Expo Go (no native Naver SDK support)
 * Shows placeholder with place count and basic info
 */
export default function NaverMapFallback({ center, layers, onPlacePress }: MapViewProps) {
  const placeCount = layers.places?.features?.length || 0;
  const peerCount = layers.peers?.features?.length || 0;

  // Get first few places for preview
  const previewPlaces = (layers.places?.features || []).slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={64} color={Colors.iosSystemBlue} />
        <TamaguiText preset="h3" textColor="primary" weight="semibold" style={styles.title}>
          지도 미리보기
        </TamaguiText>
        <TamaguiText preset="body" textColor="secondary" style={styles.subtitle}>
          Expo Go에서는 전체 지도를 사용할 수 없습니다
        </TamaguiText>
        <TamaguiText preset="caption" textColor="tertiary" style={styles.info}>
          Development Build로 전환하면 전체 기능을 사용할 수 있습니다
        </TamaguiText>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="location" size={20} color={Colors.iosSystemBlue} />
          <TamaguiText preset="body" textColor="primary" weight="semibold" style={styles.statValue}>
            {placeCount}
          </TamaguiText>
          <TamaguiText preset="caption" textColor="secondary" style={styles.statLabel}>
            장소
          </TamaguiText>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people" size={20} color={Colors.iosSystemOrange} />
          <TamaguiText preset="body" textColor="primary" weight="semibold" style={styles.statValue}>
            {peerCount}
          </TamaguiText>
          <TamaguiText preset="caption" textColor="secondary" style={styles.statLabel}>
            또래
          </TamaguiText>
        </View>
        {__DEV__ && (
          <View style={styles.statItem}>
            <Ionicons name="navigate" size={20} color={Colors.iosSystemGreen} />
            <TamaguiText preset="body" textColor="primary" weight="semibold" style={styles.statValue}>
              {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary" style={styles.statLabel}>
              현재 위치
            </TamaguiText>
          </View>
        )}
      </View>

      {/* Place Preview List */}
      {previewPlaces.length > 0 && (
        <View style={styles.previewList}>
          <TamaguiText
            preset="caption"
            textColor="secondary"
            weight="semibold"
            style={styles.previewTitle}
          >
            주변 장소
          </TamaguiText>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {previewPlaces.map((place: any, index: number) => {
            const props = place.properties || {};
            const id = String(props.id || `place-${index}`);
            return (
              <TamaguiPressableScale
                key={id}
                style={styles.placeItem}
                onPress={() => onPlacePress?.(id)}
                hapticType="light"
              >
                <Ionicons name="pin" size={16} color={Colors.iosLabel} />
                <TamaguiText
                  preset="body"
                  textColor="primary"
                  style={styles.placeName}
                  numberOfLines={1}
                >
                  {String(props.name || props.title || `장소 ${index + 1}`)}
                </TamaguiText>
                <Ionicons name="chevron-forward" size={16} color={Colors.iosTertiaryLabel} />
              </TamaguiPressableScale>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.iosSecondaryBackground,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.iosLabel,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.iosSecondaryLabel,
    marginTop: 8,
    textAlign: 'center',
  },
  info: {
    fontSize: 12,
    color: Colors.iosTertiaryLabel,
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.iosSeparator,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.iosLabel,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.iosSecondaryLabel,
  },
  previewList: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.iosSecondaryLabel,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.iosSeparator,
  },
  placeName: {
    flex: 1,
    fontSize: 15,
    color: Colors.iosLabel,
    marginLeft: 8,
  },
});

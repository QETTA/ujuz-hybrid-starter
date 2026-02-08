/**
 * ShortsGallery - Shared Component
 *
 * Horizontal scrollable gallery of shorts videos
 * Used in: ThreeSnapBottomSheet, PlaceDetailSheet
 */

import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

export interface ShortItem {
  id: string;
  thumbnail: string;
  views: string;
  title?: string;
}

export interface ShortsGalleryProps {
  shorts: ShortItem[];
  onShortPress?: (shortId: string) => void;
}

export function ShortsGallery({ shorts, onShortPress }: ShortsGalleryProps) {
  if (shorts.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {shorts.map((short) => (
        <TamaguiPressableScale
          key={short.id}
          style={styles.shortCard}
          onPress={() => onShortPress?.(short.id)}
          hapticType="light"
          accessibilityLabel={`Video ${short.title || ''} with ${short.views} views`}
          accessibilityHint={COPY.A11Y_PLAY_VIDEO}
        >
          <Image source={{ uri: short.thumbnail }} style={styles.thumbnail} resizeMode="cover" />

          {/* Play icon overlay */}
          <View
            style={styles.playOverlay}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          >
            <Ionicons name="play-circle" size={40} color={Colors.white} />
          </View>

          {/* Views count */}
          <View style={styles.viewsContainer}>
            <Ionicons
              name="eye-outline"
              size={12}
              color={Colors.white}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            />
            <TamaguiText
              preset="caption"
              textColor="inverse"
              weight="semibold"
              style={styles.viewsText}
            >
              {short.views}
            </TamaguiText>
          </View>
        </TamaguiPressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  contentContainer: {
    paddingRight: 16,
  },
  shortCard: {
    width: 120,
    height: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.overlayLight20,
  },
  viewsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.overlayMedium,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewsText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
});

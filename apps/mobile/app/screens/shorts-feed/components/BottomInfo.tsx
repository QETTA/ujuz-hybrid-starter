/**
 * BottomInfo Component
 *
 * Author info, caption, and related place button
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import { PlaceButton } from './PlaceButton';

interface BottomInfoProps {
  author: string;
  title: string;
  relatedPlace: {
    id: string;
    name: string;
    distance: number;
  };
  onVisitPlace: () => void;
}

export const BottomInfo = React.memo(function BottomInfo({
  author,
  title,
  relatedPlace,
  onVisitPlace,
}: BottomInfoProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={COPY.A11Y_VIDEO_INFO}
      accessibilityHint={COPY.A11Y_VIDEO_CAPTION_HINT}
    >
      {/* Author */}
      <View
        style={styles.authorRow}
        accessible={true}
        accessibilityLabel={`${author} 님의 영상`}
        accessibilityHint={COPY.A11Y_VIDEO_AUTHOR_HINT}
        accessibilityRole="text"
      >
        <View
          style={styles.authorAvatar}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={styles.authorInitial}>{author.charAt(0)}</Text>
        </View>
        <Text style={styles.authorName}>{author}</Text>
      </View>

      {/* Caption */}
      <Text
        style={styles.caption}
        numberOfLines={2}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`영상 설명: ${title}`}
        accessibilityHint={COPY.A11Y_VIDEO_CAPTION_HINT}
      >
        {title}
      </Text>

      {/* Related Place CTA */}
      <PlaceButton
        placeName={relatedPlace.name}
        distance={relatedPlace.distance}
        onPress={onVisitPlace}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for tab bar
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.navActive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

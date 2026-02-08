/**
 * PeekCard - Bottom Sheet Peek Level (25%)
 *
 * Minimal info: thumbnail + name + rating + distance + insight preview
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import { OptimizedImage } from '@/app/components/shared';
import type { PlaceWithDistance } from '@/app/types/places';
import type { PlaceInsights } from '@/app/types/dataBlock';

interface PeekCardProps {
  place: PlaceWithDistance;
  insights?: PlaceInsights;
}

function PeekCardInner({ place, insights }: PeekCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {place.thumbnailUrl && (
          <OptimizedImage
            uri={place.thumbnailUrl}
            style={styles.image}
            alt={`${place.name} thumbnail`}
          />
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color={Colors.iosSystemOrange} />
            <Text style={styles.ratingText}>
              {place.rating ?? 4.6} · {COPY.REVIEWS_COUNT(place.reviewCount ?? 0)}
            </Text>
          </View>
          {place.distance !== undefined && (
            <Text style={styles.distance}>
              {place.distance < 1000
                ? COPY.DISTANCE_M(Math.round(place.distance))
                : COPY.DISTANCE_KM((place.distance / 1000).toFixed(1))}
            </Text>
          )}
          {insights?.waitTime && (
            <View style={styles.insightRow}>
              <Text style={styles.insightValue}>{insights.waitTime.value}</Text>
              <Text style={styles.insightLabel}>대기</Text>
              <ConfidenceBadge confidence={insights.waitTime.confidence} size="sm" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export const PeekCard = React.memo(PeekCardInner);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.darkSurfaceElevated,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 15,
    color: Colors.darkTextSecondary,
  },
  distance: {
    fontSize: 14,
    color: Colors.darkTextTertiary,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  insightValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
  },
  insightLabel: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
  },
});

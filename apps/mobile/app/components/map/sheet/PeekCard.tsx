/**
 * PeekCard - Bottom Sheet Peek Level (25%)
 *
 * Minimal info: thumbnail + name + rating + distance + insight preview
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'tamagui';
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
  const theme = useTheme();

  const styles = useMemo(() => ({
    container: {
      paddingVertical: 12,
    },
    row: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: 12,
      backgroundColor: theme.surfaceElevated.val,
    },
    info: {
      flex: 1,
      justifyContent: 'center' as const,
    },
    name: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: theme.textPrimary.val,
      marginBottom: 4,
    },
    rating: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      marginBottom: 2,
    },
    ratingText: {
      fontSize: 15,
      color: theme.textSecondary.val,
    },
    distance: {
      fontSize: 14,
      color: theme.textTertiary.val,
    },
    insightRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      marginTop: 6,
    },
    insightValue: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: theme.textPrimary.val,
    },
    insightLabel: {
      fontSize: 12,
      color: theme.textTertiary.val,
    },
  }), [theme]);

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

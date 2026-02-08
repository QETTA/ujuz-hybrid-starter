/**
 * Rating Component
 *
 * 2026 UX: Visual star ratings with review count
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/app/constants';

interface RatingProps {
  rating: number; // 0-5
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showReviewCount?: boolean;
}

const SIZE_CONFIG = {
  sm: {
    starSize: 12,
    fontSize: 11,
    gap: 2,
  },
  md: {
    starSize: 16,
    fontSize: 13,
    gap: 4,
  },
  lg: {
    starSize: 20,
    fontSize: 15,
    gap: 6,
  },
};

export default function Rating({
  rating,
  reviewCount,
  size = 'md',
  showReviewCount = true,
}: RatingProps) {
  const config = SIZE_CONFIG[size];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const renderStars = () => {
    const stars = [];

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`full-${i}`} name="star" size={config.starSize} color={Colors.ratingStar} />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={config.starSize} color={Colors.ratingStar} />
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={config.starSize}
          color={Colors.ratingStarEmpty}
        />
      );
    }

    return stars;
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Rating: ${rating} out of 5 stars${reviewCount !== undefined ? `, ${reviewCount.toLocaleString()} reviews` : ''}`}
      accessibilityHint="Star rating display"
    >
      <View
        style={[styles.stars, { gap: config.gap }]}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      >
        {renderStars()}
      </View>
      {showReviewCount && reviewCount !== undefined && (
        <Text style={[styles.reviewCount, { fontSize: config.fontSize }]}>
          ({reviewCount.toLocaleString()})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    color: Colors.textTertiary,
    fontWeight: Typography.body2.fontWeight,
  },
});

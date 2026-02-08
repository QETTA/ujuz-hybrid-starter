/**
 * TamaguiRatingStars - Tamagui 기반 RatingStars 컴포넌트
 *
 * Star rating display component
 * Accessible - announces rating as text instead of individual stars
 *
 * 기존 RatingStars와 동일한 Props 인터페이스 유지
 */

import { styled, XStack, Text, GetProps } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { getRatingLabel } from '@/app/utils/accessibility';
import { Colors } from '@/app/constants/Colors';

// Styled container
const Container = styled(XStack, {
  name: 'RatingStarsContainer',
  alignItems: 'center',
  gap: 6,
});

// Styled stars container (hidden from screen readers)
const StarsContainer = styled(XStack, {
  name: 'StarsContainer',
  gap: 2,
});

// Styled rating text
const RatingText = styled(Text, {
  name: 'RatingText',
  fontSize: 14,
  fontWeight: '500',
  color: Colors.iosSecondaryLabel as any,
});

// Props types
export interface TamaguiRatingStarsProps {
  /** Rating value */
  rating: number;
  /** Maximum rating (default: 5) */
  maxRating?: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Star size */
  size?: number;
  /** Show rating number */
  showNumber?: boolean;
  /** Test ID */
  testID?: string;
}

export function TamaguiRatingStars({
  rating,
  maxRating = 5,
  reviewCount,
  size = 16,
  showNumber = true,
  testID,
}: TamaguiRatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < maxRating; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={size} color={Colors.ratingStar} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={size} color={Colors.ratingStar} />);
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={size} color={Colors.ratingStarEmpty} />
        );
      }
    }
    return stars;
  };

  return (
    <Container
      accessibilityRole="text"
      accessibilityLabel={getRatingLabel(rating, maxRating, reviewCount)}
      accessibilityHint="Star rating display"
      testID={testID}
    >
      {/* Stars - hidden from screen readers */}
      <StarsContainer accessibilityElementsHidden={true} importantForAccessibility="no">
        {renderStars()}
      </StarsContainer>

      {/* Rating number */}
      {showNumber && (
        <RatingText>
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` · ${reviewCount}`}
        </RatingText>
      )}
    </Container>
  );
}

// Default export for convenience
export default TamaguiRatingStars;

// Re-export types
export type { GetProps };

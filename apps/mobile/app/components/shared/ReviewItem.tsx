/**
 * ReviewItem - Shared Component
 * Design System: TamaguiText
 *
 * Review item display for place reviews
 * Used in: ThreeSnapBottomSheet, PlaceDetailSheet
 */

import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'tamagui';
import { TamaguiText, TamaguiRatingStars } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

export interface ReviewItemProps {
  author: string;
  rating: number;
  text: string;
  date: string;
  variant?: 'compact' | 'full';
}

export const ReviewItem = memo(function ReviewItem({
  author,
  rating,
  text,
  date,
  variant = 'full',
}: ReviewItemProps) {
  const theme = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor.val,
    },
    containerCompact: {
      paddingVertical: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    text: {
      marginTop: 6,
      lineHeight: 20,
    },
  }), [theme]);

  const accessibilityLabel = `Review by ${author}, ${rating} out of 5 stars, ${date}. ${text}`;

  return (
    <View
      style={[styles.container, variant === 'compact' && styles.containerCompact]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={COPY.A11Y_REVIEW}
    >
      <View style={styles.header}>
        <TamaguiText preset="body" textColor="primary" weight="semibold">
          {author}
        </TamaguiText>
        <TamaguiText preset="caption" textColor="tertiary">
          {date}
        </TamaguiText>
      </View>

      <TamaguiRatingStars rating={rating} size={14} showNumber={false} />

      <TamaguiText
        preset="body"
        textColor="secondary"
        style={styles.text}
        numberOfLines={variant === 'compact' ? 2 : undefined}
      >
        {text}
      </TamaguiText>
    </View>
  );
});

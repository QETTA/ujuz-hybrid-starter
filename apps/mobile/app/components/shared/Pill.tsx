/**
 * Pill - Shared Component
 * Design System: TamaguiText
 *
 * Small badge/pill for displaying tags and amenities
 * Used in: ThreeSnapBottomSheet, PlaceDetailSheet, PlaceCard
 */

import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

export interface PillProps {
  text: string;
  color?: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export const Pill = memo(function Pill({ text, color, variant = 'default' }: PillProps) {
  const getColorFromVariant = () => {
    switch (variant) {
      case 'success':
        return Colors.successMint;
      case 'warning':
        return Colors.iosSystemOrange;
      case 'info':
        return Colors.link;
      default:
        return color || Colors.darkTextSecondary;
    }
  };

  const pillColor = getColorFromVariant();
  const isFree = variant === 'success' || text.toLowerCase() === 'free';

  return (
    <View
      style={[styles.pill, isFree && styles.pillFree]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={text}
      accessibilityHint={COPY.A11Y_TAG_INDICATOR}
    >
      <TamaguiText preset="caption" weight="semibold" style={{ color: pillColor }}>
        {text}
      </TamaguiText>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.darkSurfaceElevated,
    marginRight: 6,
    marginBottom: 6,
  },
  pillFree: {
    backgroundColor: Colors.successMintBg,
  },
});

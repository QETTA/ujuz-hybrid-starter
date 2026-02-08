/**
 * Badge Component
 *
 * 2026 UX: Trust indicators, status badges, social proof
 */

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/app/constants';

export type BadgeVariant = 'verified' | 'popular' | 'new' | 'hot' | 'sale' | 'recommended';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  label: string;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  verified: {
    bg: Colors.badgeVerifiedBg,
    text: Colors.badgeVerified,
  },
  popular: {
    bg: Colors.badgePopularBg,
    text: Colors.badgePopular,
  },
  new: {
    bg: Colors.badgeNewBg,
    text: Colors.badgeNew,
  },
  hot: {
    bg: Colors.badgeHotBg,
    text: Colors.badgeHot,
  },
  sale: {
    bg: Colors.badgeSaleBg,
    text: Colors.badgeSale,
  },
  recommended: {
    bg: Colors.badgeRecommendedBg,
    text: Colors.badgeRecommended,
  },
};

const SIZE_STYLES = {
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    iconSize: 12,
  },
  md: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    iconSize: 14,
  },
  lg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    iconSize: 16,
  },
};

export default function Badge({
  variant = 'verified',
  size = 'sm',
  icon,
  label,
  style,
}: BadgeProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantStyle.bg,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${variant} badge: ${label}`}
      accessibilityHint="Status indicator badge"
    >
      {icon && <Text style={[styles.icon, { fontSize: sizeStyle.iconSize }]}>{icon}</Text>}
      <Text
        style={[
          styles.label,
          {
            color: variantStyle.text,
            fontSize: sizeStyle.fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  icon: {
    lineHeight: 16,
  },
  label: {
    fontWeight: '600',
    lineHeight: 16,
  },
});

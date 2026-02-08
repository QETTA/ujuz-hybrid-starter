import { View, StyleSheet } from 'react-native';
import { Colors } from '@/app/constants';
import { TamaguiText } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

interface Props {
  confidence: number;
  size?: 'sm' | 'md';
}

export default function ConfidenceBadge({ confidence, size = 'md' }: Props) {
  const level = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';
  const config = {
    high: {
      color: Colors.badgeVerified,
      bg: Colors.badgeVerifiedBg,
      label: COPY.CONFIDENCE.high,
    },
    medium: {
      color: Colors.badgePopular,
      bg: Colors.badgePopularBg,
      label: COPY.CONFIDENCE.medium,
    },
    low: {
      color: Colors.badgeNew,
      bg: Colors.badgeNewBg,
      label: COPY.CONFIDENCE.low,
    },
  } as const;

  const theme = config[level];
  const fontSize = size === 'sm' ? 10 : 11;
  const paddingHorizontal = size === 'sm' ? 6 : 8;
  const paddingVertical = size === 'sm' ? 3 : 4;

  return (
    <View
      style={[styles.badge, { backgroundColor: theme.bg, paddingHorizontal, paddingVertical }]}
      accessibilityRole="text"
      accessibilityLabel={`신뢰도 ${theme.label}`}
    >
      <TamaguiText
        preset="caption"
        weight="bold"
        style={{ color: theme.color, fontSize, letterSpacing: -0.2 }}
      >
        {theme.label}
      </TamaguiText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

/**
 * SocialProofBadge - 소셜 프루프 뱃지
 *
 * "5,432명의 부모가 이용 중" 아바타 스택 + 카운트
 */

import { StyleSheet, View } from 'react-native';
import { XStack, Text, useTheme } from 'tamagui';
import { TamaguiAvatar } from './TamaguiAvatar';

export interface SocialProofBadgeProps {
  /** Number of users */
  count: number;
  /** Label template — {count} will be replaced */
  label?: string;
  /** Avatar image URIs (up to 3 shown) */
  avatars?: string[];
  /** Size variant */
  size?: 'sm' | 'md';
}

const PLACEHOLDER_AVATARS = [
  'https://i.pravatar.cc/100?img=1',
  'https://i.pravatar.cc/100?img=2',
  'https://i.pravatar.cc/100?img=3',
];

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${n.toLocaleString()}`;
  return `${n}`;
}

export function SocialProofBadge({
  count,
  label = '{count}명의 부모가 이용 중',
  avatars = PLACEHOLDER_AVATARS,
  size = 'md',
}: SocialProofBadgeProps) {
  const theme = useTheme();
  const displayAvatars = avatars.slice(0, 3);
  const avatarSize = size === 'sm' ? 20 : 24;
  const fontSize = size === 'sm' ? 11 : 13;
  const overlap = size === 'sm' ? -6 : -8;

  const formattedLabel = label.replace('{count}', formatCount(count));

  return (
    <XStack alignItems="center" gap="$2">
      <View style={styles.avatarStack}>
        {displayAvatars.map((uri, i) => (
          <View
            key={i}
            style={[
              styles.avatarWrapper,
              {
                marginLeft: i === 0 ? 0 : overlap,
                zIndex: displayAvatars.length - i,
                width: avatarSize + 2,
                height: avatarSize + 2,
                borderRadius: (avatarSize + 2) / 2,
                borderColor: theme.background.val,
              },
            ]}
          >
            <TamaguiAvatar
              size={avatarSize as any}
              source={uri}
              fallback="U"
            />
          </View>
        ))}
      </View>
      <Text fontSize={fontSize} color="$textSecondary" fontWeight="500">
        {formattedLabel}
      </Text>
    </XStack>
  );
}

const styles = StyleSheet.create({
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 1.5,
    borderRadius: 999,
    overflow: 'hidden',
  },
});

export default SocialProofBadge;

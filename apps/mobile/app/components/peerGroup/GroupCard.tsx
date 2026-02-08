// 모임 카드 컴포넌트

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import type { PeerGroup } from '@/app/types/peerGroup';

interface GroupCardProps {
  group: PeerGroup;
  onPress?: () => void;
  showMemberCount?: boolean;
}

export const GroupCard = React.memo(function GroupCard({
  group,
  onPress,
  showMemberCount = true,
}: GroupCardProps) {
  const minAge = Math.floor(group.min_age_months / 12);
  const maxAge = Math.floor(group.max_age_months / 12);
  const ageLabel = `${minAge}~${maxAge}세`;

  return (
    <TamaguiPressableScale
      style={styles.container}
      onPress={onPress}
      hapticType="light"
      accessibilityLabel={group.name}
      accessibilityHint="모임 상세 화면으로 이동합니다"
    >
      {group.image_url ? (
        <Image source={{ uri: group.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="people" size={24} color={Colors.darkTextTertiary} />
        </View>
      )}

      <View style={styles.content}>
        <TamaguiText
          preset="body"
          textColor="primary"
          weight="semibold"
          style={styles.name}
          numberOfLines={1}
        >
          {group.name}
        </TamaguiText>

        <View style={styles.meta}>
          <View style={styles.badge}>
            <TamaguiText preset="caption" weight="medium" style={styles.badgeText}>
              {ageLabel}
            </TamaguiText>
          </View>

          {group.region && (
            <TamaguiText
              preset="caption"
              textColor="secondary"
              style={styles.region}
              numberOfLines={1}
            >
              {group.region}
            </TamaguiText>
          )}
        </View>

        {showMemberCount && group.member_count !== undefined && (
          <View style={styles.footer}>
            <Ionicons name="people-outline" size={14} color={Colors.darkTextSecondary} />
            <TamaguiText preset="caption" textColor="secondary" style={styles.memberCount}>
              {group.member_count}명
            </TamaguiText>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={Colors.darkTextTertiary} />
    </TamaguiPressableScale>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.darkSurface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  placeholder: {
    backgroundColor: Colors.darkSurfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    backgroundColor: Colors.primaryAlpha15,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  region: {
    fontSize: 13,
    color: Colors.darkTextSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 13,
    color: Colors.darkTextSecondary,
  },
});

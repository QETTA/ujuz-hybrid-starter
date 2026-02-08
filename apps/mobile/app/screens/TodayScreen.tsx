/**
 * TodayScreen - Anticipatory Design (0-tap recommendations)
 *
 * Phase 1 MVP: Displays today's recommendations with DataBlock evidence
 * 2026 Design System: TamaguiText, TamaguiFloatingCard, TamaguiChip
 */

import { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { YStack, XStack } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants';
import { usePlaceStore } from '@/app/stores/placeStore';
import { useProfileStore } from '@/app/stores/profileStore';
import { useDataHub, type Activity } from '@/app/hooks';
import { generateTodayRecommendation, useUrgentDeals } from '@/app/services/predictions';

// Design System Components
import {
  TamaguiText,
  TamaguiFloatingCard,
  TamaguiChip,
  TamaguiChipGroup,
} from '@/app/design-system';

// Age badge component using DS
function AgeBadge({ months }: { months: number }) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const ageText = years > 0 ? `${years}세 ${remainingMonths}개월` : `${months}개월`;

  return (
    <View style={styles.ageBadge}>
      <TamaguiText preset="caption" textColor="brand" weight="semibold">
        {ageText}
      </TamaguiText>
    </View>
  );
}

export default function TodayScreen() {
  // Store data
  const childName = useProfileStore((state) => state.childName);
  const getChildAgeMonths = useProfileStore((state) => state.getChildAgeMonths);
  const favoritePlaces = usePlaceStore((state) => state.favoritePlaces);
  const recommendations = usePlaceStore((state) => state.recommendations);

  // Dashboard data
  const dashboard = useDataHub();
  const { count: urgentDealsCount } = useUrgentDeals();

  // Generate today's recommendation
  const todayRec = useMemo(() => {
    const places = recommendations.length > 0 ? recommendations : favoritePlaces;
    return generateTodayRecommendation(places);
  }, [recommendations, favoritePlaces]);

  const childAgeMonths = getChildAgeMonths();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <TamaguiText preset="h2" textColor="primary">
              오늘의 추천
            </TamaguiText>
            <AgeBadge months={childAgeMonths} />
          </XStack>
          <TamaguiText preset="body" textColor="secondary">
            {childName}을 위한 맞춤 추천이에요
          </TamaguiText>
        </YStack>

        {/* Stats Row - Using TamaguiChip */}
        <TamaguiChipGroup gap={8}>
          <TamaguiChip
            label={`저장 ${dashboard.savedCount}`}
            leftIcon="bookmark-outline"
            variant="soft"
            size="sm"
          />
          <TamaguiChip
            label={`마감임박 ${urgentDealsCount}`}
            leftIcon="pricetag-outline"
            variant="soft"
            size="sm"
          />
          <TamaguiChip
            label={`또래모임 ${dashboard.groupCount}`}
            leftIcon="people-outline"
            variant="soft"
            size="sm"
          />
        </TamaguiChipGroup>

        {/* Main Recommendation Card */}
        {todayRec.topPick ? (
          <TamaguiFloatingCard depth="elevated" padding="md">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="flex-start">
                <YStack flex={1} gap="$1">
                  <TamaguiText preset="h4" textColor="primary" weight="bold">
                    {todayRec.topPick.place.name}
                  </TamaguiText>
                  <TamaguiText preset="body" textColor="secondary">
                    {todayRec.topPick.place.category || '장소'}
                  </TamaguiText>
                </YStack>
                <View style={styles.confidenceBadge}>
                  <TamaguiText preset="caption" textColor="brand">
                    {Math.round(todayRec.topPick.confidence * 100)}% 확신
                  </TamaguiText>
                </View>
              </XStack>

              {/* Reason */}
              <View style={styles.reasonBox}>
                <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                <TamaguiText preset="body" textColor="primary" style={styles.reasonText}>
                  {todayRec.topPick.reason}
                </TamaguiText>
              </View>

              {/* Suggested Time */}
              <XStack alignItems="center" gap="$2">
                <Ionicons name="time-outline" size={16} color={Colors.iosSecondaryLabel} />
                <TamaguiText preset="bodySmall" textColor="secondary">
                  추천 시간: {todayRec.topPick.suggestedTimeLabel}
                </TamaguiText>
              </XStack>

              {/* Evidence count */}
              {todayRec.topPick.basedOn.length > 0 && (
                <TamaguiText preset="caption" textColor="tertiary">
                  {todayRec.topPick.basedOn.length}개 데이터 기반
                </TamaguiText>
              )}
            </YStack>
          </TamaguiFloatingCard>
        ) : (
          <TamaguiFloatingCard depth="elevated" padding="md">
            <YStack alignItems="center" gap="$3" paddingVertical="$4">
              <Ionicons name="compass-outline" size={48} color={Colors.iosTertiaryLabel} />
              <TamaguiText preset="bodyLarge" textColor="secondary" align="center">
                저장한 장소가 없어요
              </TamaguiText>
              <TamaguiText preset="body" textColor="tertiary" align="center">
                장소를 저장하면 맞춤 추천을 받을 수 있어요
              </TamaguiText>
            </YStack>
          </TamaguiFloatingCard>
        )}

        {/* Alternatives */}
        {todayRec.alternatives.length > 0 && (
          <YStack gap="$3">
            <TamaguiText preset="h4" textColor="primary" weight="semibold">
              다른 추천
            </TamaguiText>
            {todayRec.alternatives.map((alt, index) => (
              <TamaguiFloatingCard key={alt.place.id || index} depth="raised" padding="sm">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <TamaguiText preset="bodyLarge" textColor="primary" weight="semibold">
                      {alt.place.name}
                    </TamaguiText>
                    <TamaguiText preset="bodySmall" textColor="tertiary">
                      {alt.reason}
                    </TamaguiText>
                  </YStack>
                  <Ionicons name="chevron-forward" size={20} color={Colors.iosTertiaryLabel} />
                </XStack>
              </TamaguiFloatingCard>
            ))}
          </YStack>
        )}

        {/* Recent Activity */}
        {dashboard.recentActivities.length > 0 && (
          <YStack gap="$3">
            <TamaguiText preset="h4" textColor="primary" weight="semibold">
              최근 활동
            </TamaguiText>
            {dashboard.recentActivities.slice(0, 5).map((activity: Activity) => (
              <XStack key={activity.id} alignItems="center" gap="$3">
                <Ionicons
                  name={
                    activity.type === 'visit'
                      ? 'location-outline'
                      : activity.type === 'save'
                        ? 'bookmark-outline'
                        : 'people-outline'
                  }
                  size={20}
                  color={Colors.iosSecondaryLabel}
                />
                <TamaguiText preset="body" textColor="secondary" style={styles.flex1}>
                  {activity.title}
                </TamaguiText>
              </XStack>
            ))}
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.iosSystemBackground,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  ageBadge: {
    backgroundColor: Colors.primaryAlpha10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  confidenceBadge: {
    backgroundColor: Colors.primaryAlpha10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reasonBox: {
    backgroundColor: Colors.iosSecondaryBackground,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonText: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
});

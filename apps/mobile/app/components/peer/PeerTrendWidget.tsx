/**
 * PeerTrendWidget - 또래 트렌드 위젯
 *
 * 2026 UJUz 테마 토큰 기반
 */

import { useState } from 'react';
import { ScrollView, Image } from 'react-native';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import type {
  PeerTrends,
  PeerTrendingPlace,
  PeerTrendingGroupBuy,
  TrendPeriod,
} from '@/app/types/peerSync';
import { Colors } from '@/app/constants';
import { TamaguiPressableScale, TamaguiChip, SocialProofBadge } from '@/app/design-system';

export interface PeerTrendWidgetProps {
  trends: PeerTrends;
  onPlacePress?: (placeId: string) => void;
  onGroupBuyPress?: (groupBuyId: string) => void;
  onSeeAllPress?: (type: 'places' | 'groupbuys') => void;
  testID?: string;
}

function TrendingPlaceItem({
  place,
  rank,
  onPress,
}: {
  place: PeerTrendingPlace;
  rank: number;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <TamaguiPressableScale
      style={{ width: 152, marginRight: 12 }}
      onPress={onPress}
      hapticType="light"
    >
      <YStack position="relative" marginBottom={10}>
        <Image
          source={{ uri: place.place.thumbnailUrl || 'https://picsum.photos/152/108' }}
          style={{
            width: 152,
            height: 108,
            borderRadius: 14,
            backgroundColor: theme.surfaceElevated.val,
          }}
          resizeMode="cover"
        />
        <XStack
          position="absolute"
          bottom={-8}
          left={8}
          width={24}
          height={24}
          borderRadius={12}
          backgroundColor={rank === 1 ? '$primary' : '$textSecondary'}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={12} fontWeight="700" color="$background">
            {rank}
          </Text>
        </XStack>
      </YStack>

      <Text
        fontSize={14}
        fontWeight="600"
        color="$textPrimary"
        numberOfLines={1}
        marginTop={4}
      >
        {place.place.name}
      </Text>

      <Text fontSize={12} color="$textTertiary" marginTop={2}>
        {place.peerVisitCount}명 방문
      </Text>
    </TamaguiPressableScale>
  );
}

function TrendingGroupBuyItem({
  groupBuy,
  onPress,
}: {
  groupBuy: PeerTrendingGroupBuy;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <TamaguiPressableScale
      style={{
        width: 180,
        marginRight: 12,
        padding: 14,
        backgroundColor: theme.surface.val,
        borderRadius: 16,
      }}
      onPress={onPress}
      hapticType="light"
    >
      <YStack position="relative" marginBottom={10}>
        <Image
          source={{ uri: groupBuy.thumbnailUrl || 'https://picsum.photos/180/100' }}
          style={{
            width: '100%',
            height: 90,
            borderRadius: 10,
            backgroundColor: theme.surfaceElevated.val,
          }}
          resizeMode="cover"
        />
        <XStack
          position="absolute"
          top={8}
          right={8}
          paddingVertical={4}
          paddingHorizontal={8}
          backgroundColor={Colors.deal as any}
          borderRadius={6}
        >
          <Text fontSize={11} fontWeight="700" color="white">
            {groupBuy.discountPercent}%
          </Text>
        </XStack>
      </YStack>

      <Text
        fontSize={13}
        fontWeight="600"
        color="$textPrimary"
        numberOfLines={2}
        lineHeight={18}
        marginBottom={4}
      >
        {groupBuy.title}
      </Text>

      <Text fontSize={18} fontWeight="700" color="$textPrimary" letterSpacing={-0.5}>
        {groupBuy.discountedPrice.toLocaleString()}원
      </Text>

      <XStack marginTop={4}>
        <SocialProofBadge
          count={groupBuy.peerParticipantCount}
          label="{count}명 참여"
          size="sm"
        />
      </XStack>
    </TamaguiPressableScale>
  );
}

export function PeerTrendWidget({
  trends,
  onPlacePress,
  onGroupBuyPress,
  onSeeAllPress,
  testID,
}: PeerTrendWidgetProps) {
  const [period, setPeriod] = useState<TrendPeriod>('week');

  const periodLabels: Record<TrendPeriod, string> = {
    today: '오늘',
    week: '이번 주',
    month: '이번 달',
  };

  return (
    <YStack gap={28} testID={testID}>
      <XStack gap={8} paddingHorizontal={20}>
        {(['today', 'week', 'month'] as TrendPeriod[]).map((p) => (
          <TamaguiChip
            key={p}
            label={periodLabels[p]}
            variant={period === p ? 'filled' : 'outlined'}
            onPress={() => setPeriod(p)}
          />
        ))}
      </XStack>

      <YStack gap={14}>
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal={20}
        >
          <Text fontSize={17} fontWeight="700" color="$textPrimary" letterSpacing={-0.4}>
            인기 장소
          </Text>
          <TamaguiPressableScale
            onPress={() => onSeeAllPress?.('places')}
            hapticType="light"
            style={{ padding: 8, margin: -8 }}
          >
            <Text fontSize={13} color="$textTertiary" fontWeight="500">
              전체보기
            </Text>
          </TamaguiPressableScale>
        </XStack>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 36 }}
        >
          {trends.topPlaces.slice(0, 5).map((place, index) => (
            <TrendingPlaceItem
              key={place.place.id}
              place={place}
              rank={index + 1}
              onPress={() => onPlacePress?.(place.place.id)}
            />
          ))}
        </ScrollView>
      </YStack>

      <YStack gap={14}>
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal={20}
        >
          <Text fontSize={17} fontWeight="700" color="$textPrimary" letterSpacing={-0.4}>
            인기 공구
          </Text>
          <TamaguiPressableScale
            onPress={() => onSeeAllPress?.('groupbuys')}
            hapticType="light"
            style={{ padding: 8, margin: -8 }}
          >
            <Text fontSize={13} color="$textTertiary" fontWeight="500">
              전체보기
            </Text>
          </TamaguiPressableScale>
        </XStack>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 36 }}
        >
          {trends.topGroupBuys.slice(0, 3).map((groupBuy) => (
            <TrendingGroupBuyItem
              key={groupBuy.id}
              groupBuy={groupBuy}
              onPress={() => onGroupBuyPress?.(groupBuy.id)}
            />
          ))}
        </ScrollView>
      </YStack>
    </YStack>
  );
}

export default PeerTrendWidget;

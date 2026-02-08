/**
 * GroupBuyScreen - 공동구매 목록 화면
 *
 * 활성 공동구매 캠페인 브라우징
 *
 * Tamagui Design System 전환 완료
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { RefreshControl, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { XStack, YStack, Text, useTheme } from 'tamagui';

import { useGroupBuys, useGroupBuyActions } from '@/app/hooks/useGroupBuys';
import {
  TamaguiEmptyState,
  TamaguiErrorView,
  TamaguiLoading,
  TamaguiChip,
  SocialProofBadge,
  TamaguiPressableScale,
  ConfettiOverlay,
} from '@/app/design-system';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import type { GroupBuy } from '@/app/stores/groupBuyStore';
import { COPY } from '@/app/copy/copy.ko';

type FilterTab = 'all' | 'ticket' | 'product';
type SortOption = 'popular' | 'deadline' | 'discount';

// Animated progress bar component with spring animation
function AnimatedProgressBar({ rate }: { rate: number }) {
  const theme = useTheme();
  const primaryColor = theme.primary.val;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(Math.min(rate, 100), {
      damping: 18,
      stiffness: 120,
      mass: 1,
    });
  }, [rate, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    height: '100%',
    backgroundColor: primaryColor,
    borderRadius: 3,
  }));

  return (
    <XStack
      flex={1}
      height={6}
      backgroundColor="$backgroundStrong"
      borderRadius={3}
      overflow="hidden"
    >
      <Animated.View style={animatedStyle} />
    </XStack>
  );
}

export default function GroupBuyScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  useAnalytics('Deals');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const trustStats = { blockCount: 212, confidence: 0.91, sources: 3 };

  const { filteredGroupBuys, isLoading, error, refetch } = useGroupBuys();
  const { joinGroupBuy, leaveGroupBuy, isJoined, setFilter } = useGroupBuyActions();
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // 탭 변경 시 필터 업데이트
  useEffect(() => {
    setFilter({
      itemType: activeTab === 'all' ? undefined : activeTab,
      sortBy: sortBy,
    });
  }, [activeTab, sortBy, setFilter]);

  const handleTabPress = useCallback((tab: FilterTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

  const handleSortPress = useCallback((sort: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(sort);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRefreshing(false);
  }, [refetch]);

  const handleJoinPress = useCallback(
    (groupBuy: GroupBuy) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (isJoined(groupBuy.id)) {
        leaveGroupBuy(groupBuy.id);
      } else {
        joinGroupBuy(groupBuy.id);
        // Confetti on goal achievement (optimistic: +1 pushes to 100%)
        const nextQty = (groupBuy.current_quantity ?? 0) + 1;
        const goalQty = groupBuy.goal_quantity ?? 0;
        if (goalQty > 0 && nextQty >= goalQty) {
          setShowConfetti(true);
        }
      }
    },
    [isJoined, joinGroupBuy, leaveGroupBuy]
  );

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  const formatDeadline = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return '마감';
    if (days === 1) return 'D-1';
    if (days <= 7) return `D-${days}`;
    return `${days}일 남음`;
  };

  const iconColor = useMemo(() => theme.textSecondary.val, [theme]);
  const tertiaryIconColor = useMemo(() => theme.textTertiary.val, [theme]);

  const renderGroupBuyCard = useCallback(
    ({ item }: { item: GroupBuy }) => {
      const joined = isJoined(item.id);
      const deadline = formatDeadline(item.end_date);
      const isUrgent = deadline.includes('D-') && parseInt(deadline.replace('D-', '')) <= 3;

      return (
        <YStack
          backgroundColor="$backgroundHover"
          borderRadius={16}
          overflow="hidden"
          borderWidth={0.5}
          borderColor="$borderColor"
          marginBottom="$3"
        >
          {/* 썸네일 */}
          <YStack position="relative">
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={{ width: '100%', height: 160, backgroundColor: theme.backgroundStrong?.val }}
              />
            ) : (
              <YStack
                width="100%"
                height={160}
                backgroundColor="$backgroundStrong"
                justifyContent="center"
                alignItems="center"
              >
                <Ionicons
                  name={item.item_type === 'ticket' ? 'ticket-outline' : 'cube-outline'}
                  size={32}
                  color={tertiaryIconColor}
                />
              </YStack>
            )}

            {/* 할인 배지 */}
            {item.max_discount_rate && item.max_discount_rate > 0 && (
              <XStack
                position="absolute"
                top={12}
                left={12}
                backgroundColor="$deal"
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={12}
              >
                <Text color="$background" fontSize={13} fontWeight="700">
                  {item.max_discount_rate}%
                </Text>
              </XStack>
            )}

            {/* 마감 임박 배지 */}
            {isUrgent && (
              <XStack
                position="absolute"
                top={12}
                right={12}
                backgroundColor="$warning"
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={12}
              >
                <Text color="$background" fontSize={12} fontWeight="600">
                  {deadline}
                </Text>
              </XStack>
            )}
          </YStack>

          {/* 정보 */}
          <YStack padding="$4">
            {/* 타입 태그 */}
            <XStack
              alignSelf="flex-start"
              paddingHorizontal="$2"
              paddingVertical="$1"
              backgroundColor="$backgroundStrong"
              borderRadius={8}
              marginBottom="$2"
            >
              <Text fontSize={12} color="$textSecondary">
                {item.item_type === 'ticket' ? '🎫 입장권' : '🍼 유아식품'}
              </Text>
            </XStack>

            {/* 제목 */}
            <Text
              fontSize={16}
              fontWeight="600"
              color="$textPrimary"
              marginBottom="$2"
              lineHeight={22}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            {/* 가격 */}
            <XStack alignItems="center" gap="$2" marginBottom="$3">
              {item.regular_price && (
                <Text fontSize={14} color="$textTertiary" textDecorationLine="line-through">
                  {formatPrice(item.regular_price)}
                </Text>
              )}
              {item.group_price && (
                <Text fontSize={18} fontWeight="700" color="$primary" letterSpacing={-0.3}>
                  {formatPrice(item.group_price)}
                </Text>
              )}
            </XStack>

            {/* 진행률 */}
            <XStack alignItems="center" gap="$2" marginBottom="$3">
              <AnimatedProgressBar rate={item.achievement_rate} />
              <Text fontSize={12} fontWeight="600" color="$primary" minWidth={60}>
                {item.achievement_rate}% 달성
              </Text>
            </XStack>

            {/* 참여자 & 마감일 */}
            <XStack justifyContent="space-between" marginBottom="$3">
              <XStack alignItems="center" gap="$1">
                <Ionicons name="people-outline" size={14} color={iconColor} />
                <Text fontSize={13} color="$textSecondary">
                  {item.supporter_count}명 참여
                </Text>
              </XStack>
              <XStack alignItems="center" gap="$1">
                <Ionicons name="time-outline" size={14} color={iconColor} />
                <Text
                  fontSize={13}
                  color={isUrgent ? '$warning' : '$textSecondary'}
                  fontWeight={isUrgent ? '600' : undefined}
                >
                  {deadline}
                </Text>
              </XStack>
            </XStack>

            {/* 소셜 프루프 배지 */}
            <YStack marginBottom="$3">
              <SocialProofBadge
                count={item.supporter_count}
                label="{count}명 참여 중"
                size="sm"
              />
            </YStack>

            {/* 참여 버튼 */}
            <TamaguiPressableScale
              hapticType="medium"
              onPress={() => handleJoinPress(item)}
              accessibilityLabel={joined ? '참여 취소' : '참여하기'}
              style={{
                backgroundColor: joined ? theme.backgroundStrong?.val : theme.primary.val,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center' as const,
                borderWidth: joined ? 0.5 : 0,
                borderColor: joined ? theme.borderColor?.val : undefined,
              }}
            >
              <Text
                fontSize={15}
                fontWeight="600"
                color={joined ? '$textSecondary' : '$background'}
                textAlign="center"
              >
                {joined ? '✓ 참여중' : '참여하기 →'}
              </Text>
            </TamaguiPressableScale>
          </YStack>
        </YStack>
      );
    },
    [isJoined, handleJoinPress, iconColor, tertiaryIconColor, theme]
  );

  const keyExtractor = useCallback((item: GroupBuy) => item.id, []);

  if (isLoading && filteredGroupBuys.length === 0) {
    return <TamaguiLoading message="공동구매 불러오는 중..." />;
  }

  if (error && filteredGroupBuys.length === 0) {
    // 500 오류 등 서버 에러 안내
    const errorMsg =
      typeof error === 'string' ? error : (error as Error)?.message || 'Unknown error';
    const isServerError = errorMsg?.includes('Server error') || errorMsg?.includes('500');
    const requestId = (error as any)?.requestId;
    const userMessage = isServerError
      ? '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      : errorMsg;
    const messageWithId = requestId ? `${userMessage}\n(오류 ID: ${requestId})` : userMessage;

    return (
      <TamaguiErrorView
        title={isServerError ? '서버 오류가 발생했어요' : '공동구매를 불러오지 못했어요'}
        message={messageWithId}
        onRetry={refetch}
      />
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ConfettiOverlay
        visible={showConfetti}
        onFinish={() => setShowConfetti(false)}
      />
      {/* 헤더 */}
      <YStack
        paddingHorizontal="$5"
        paddingBottom="$3"
        paddingTop={insets.top + 16}
        backgroundColor="$background"
        accessible={true}
        accessibilityRole="header"
      >
        <Text fontSize={28} fontWeight="700" color="$textPrimary" letterSpacing={-0.5}>
          {COPY.SCREEN_DEALS}
        </Text>
        <Text fontSize={14} color="$textSecondary" marginTop={4}>
          쿠폰/혜택 모아보기
        </Text>
        <XStack marginTop={10} alignItems="center" justifyContent="space-between">
          <Text fontSize={12} color="$textTertiary">
            {COPY.TRUST_ROW(
              trustStats.blockCount,
              trustStats.sources,
              Math.round(trustStats.confidence * 100)
            )}
          </Text>
          <ConfidenceBadge confidence={trustStats.confidence} size="sm" />
        </XStack>
      </YStack>

      {/* 탭 바 (TamaguiChip) */}
      <XStack
        paddingHorizontal="$4"
        gap="$2"
        paddingVertical="$2"
        accessibilityRole="tablist"
      >
        {(['all', 'ticket', 'product'] as FilterTab[]).map((tab) => (
          <TamaguiChip
            key={tab}
            label={tab === 'all' ? '전체' : tab === 'ticket' ? '입장권' : '유아식품'}
            variant={activeTab === tab ? 'filled' : 'glass'}
            onPress={() => handleTabPress(tab)}
          />
        ))}
      </XStack>

      {/* 정렬 옵션 (TamaguiChip) */}
      <XStack paddingHorizontal="$4" paddingVertical="$2" gap="$2">
        {(['popular', 'deadline', 'discount'] as SortOption[]).map((sort) => (
          <TamaguiChip
            key={sort}
            label={sort === 'popular' ? '인기순' : sort === 'deadline' ? '마감임박' : '할인율순'}
            variant={sortBy === sort ? 'deal' : 'outlined'}
            onPress={() => handleSortPress(sort)}
          />
        ))}
      </XStack>

      {/* 목록 */}
      <FlashList
        data={filteredGroupBuys}
        renderItem={renderGroupBuyCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary.val}
          />
        }
        ListEmptyComponent={
          <TamaguiEmptyState
            icon="cart-outline"
            title="진행 중인 공동구매가 없습니다"
            message="새로운 공동구매가 시작되면 알려드릴게요!"
          />
        }
      />
    </YStack>
  );
}

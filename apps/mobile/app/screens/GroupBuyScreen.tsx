/**
 * GroupBuyScreen - 공동구매 목록 화면
 *
 * 활성 공동구매 캠페인 브라우징
 */

import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useGroupBuys, useGroupBuyActions } from '@/app/hooks/useGroupBuys';
import { TamaguiEmptyState, TamaguiErrorView, TamaguiLoading } from '@/app/design-system';
import { Colors, Layout } from '@/app/constants';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import type { GroupBuy } from '@/app/stores/groupBuyStore';
import { COPY } from '@/app/copy/copy.ko';

type FilterTab = 'all' | 'ticket' | 'product';
type SortOption = 'popular' | 'deadline' | 'discount';

export default function GroupBuyScreen() {
  const insets = useSafeAreaInsets();
  useAnalytics('Deals');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const trustStats = { blockCount: 212, confidence: 0.91, sources: 3 };

  const { filteredGroupBuys, isLoading, error, refetch } = useGroupBuys();
  const { joinGroupBuy, leaveGroupBuy, isJoined, setFilter } = useGroupBuyActions();
  const [refreshing, setRefreshing] = useState(false);

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

  const renderGroupBuyCard = useCallback(
    ({ item }: { item: GroupBuy }) => {
      const joined = isJoined(item.id);
      const deadline = formatDeadline(item.end_date);
      const isUrgent = deadline.includes('D-') && parseInt(deadline.replace('D-', '')) <= 3;

      return (
        <View style={styles.card}>
          {/* 썸네일 */}
          <View style={styles.cardImageContainer}>
            {item.thumbnail_url ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Ionicons
                  name={item.item_type === 'ticket' ? 'ticket-outline' : 'cube-outline'}
                  size={32}
                  color={Colors.darkTextTertiary}
                />
              </View>
            )}

            {/* 할인 배지 */}
            {item.max_discount_rate && item.max_discount_rate > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{item.max_discount_rate}%</Text>
              </View>
            )}

            {/* 마감 임박 배지 */}
            {isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>{deadline}</Text>
              </View>
            )}
          </View>

          {/* 정보 */}
          <View style={styles.cardContent}>
            {/* 타입 태그 */}
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>
                {item.item_type === 'ticket' ? '🎫 입장권' : '🍼 유아식품'}
              </Text>
            </View>

            {/* 제목 */}
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {/* 가격 */}
            <View style={styles.priceRow}>
              {item.regular_price && (
                <Text style={styles.originalPrice}>{formatPrice(item.regular_price)}</Text>
              )}
              {item.group_price && (
                <Text style={styles.groupPrice}>{formatPrice(item.group_price)}</Text>
              )}
            </View>

            {/* 진행률 */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(item.achievement_rate, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{item.achievement_rate}% 달성</Text>
            </View>

            {/* 참여자 & 마감일 */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={14} color={Colors.darkTextSecondary} />
                <Text style={styles.statText}>{item.supporter_count}명 참여</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color={Colors.darkTextSecondary} />
                <Text style={[styles.statText, isUrgent && styles.urgentText]}>{deadline}</Text>
              </View>
            </View>

            {/* 참여 버튼 */}
            <TouchableOpacity
              style={[styles.joinButton, joined && styles.joinedButton]}
              onPress={() => handleJoinPress(item)}
              accessibilityLabel={joined ? '참여 취소' : '참여하기'}
              accessibilityRole="button"
            >
              <Text style={[styles.joinButtonText, joined && styles.joinedButtonText]}>
                {joined ? '✓ 참여중' : '참여하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [isJoined, handleJoinPress]
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
    <View style={styles.container}>
      {/* 헤더 */}
      <View
        style={[styles.header, { paddingTop: insets.top + Layout.spacing.md }]}
        accessible={true}
        accessibilityRole="header"
      >
        <Text style={styles.title}>{COPY.SCREEN_DEALS}</Text>
        <Text style={styles.subtitle}>쿠폰/혜택 모아보기</Text>
        <View style={styles.trustRow}>
          <Text style={styles.trustText}>
            {COPY.TRUST_ROW(
              trustStats.blockCount,
              trustStats.sources,
              Math.round(trustStats.confidence * 100)
            )}
          </Text>
          <ConfidenceBadge confidence={trustStats.confidence} size="sm" />
        </View>
      </View>

      {/* 탭 바 */}
      <View style={styles.tabBar} accessibilityRole="tablist">
        {(['all', 'ticket', 'product'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabPress(tab)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab === 'all' ? '전체' : tab === 'ticket' ? '입장권' : '유아식품'} 탭`}
            accessibilityHint="공동구매 목록을 필터링합니다"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all' ? '전체' : tab === 'ticket' ? '입장권' : '유아식품'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 정렬 옵션 */}
      <View style={styles.sortBar}>
        {(['popular', 'deadline', 'discount'] as SortOption[]).map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortOption, sortBy === sort && styles.sortOptionActive]}
            onPress={() => handleSortPress(sort)}
            accessibilityRole="button"
            accessibilityLabel={`정렬: ${sort === 'popular' ? '인기순' : sort === 'deadline' ? '마감임박' : '할인율순'}`}
            accessibilityHint="공동구매 목록 정렬 기준을 변경합니다"
            accessibilityState={{ selected: sortBy === sort }}
          >
            <Text style={[styles.sortText, sortBy === sort && styles.sortTextActive]}>
              {sort === 'popular' ? '인기순' : sort === 'deadline' ? '마감임박' : '할인율순'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 목록 */}
      <FlashList
        data={filteredGroupBuys}
        renderItem={renderGroupBuyCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.darkTextSecondary,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    backgroundColor: Colors.darkBg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.darkTextSecondary,
    marginTop: 4,
  },
  trustRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trustText: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.darkBg,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkBorder,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.darkTextTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  sortBar: {
    flexDirection: 'row',
    backgroundColor: Colors.darkBg,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 8,
    gap: 8,
  },
  sortOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.darkSurface,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary,
  },
  sortText: {
    fontSize: 13,
    color: Colors.darkTextSecondary,
  },
  sortTextActive: {
    color: Colors.darkBg,
  },
  listContent: {
    padding: Layout.spacing.md,
  },
  card: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    marginBottom: 12,
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.darkSurfaceElevated,
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 8,
    marginBottom: 8,
  },
  typeTagText: {
    fontSize: 12,
    color: Colors.darkTextSecondary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.darkTextTertiary,
    textDecorationLine: 'line-through',
  },
  groupPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    minWidth: 60,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.darkTextSecondary,
  },
  urgentText: {
    color: Colors.warning,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinedButton: {
    backgroundColor: Colors.darkSurfaceElevated,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  joinButtonText: {
    color: Colors.darkBg,
    fontSize: 15,
    fontWeight: '600',
  },
  joinedButtonText: {
    color: Colors.darkTextSecondary,
  },
});

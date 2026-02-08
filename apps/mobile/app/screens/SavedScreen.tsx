/**
 * SavedScreen - Tamagui 버전
 *
 * 저장된 장소 및 콘텐츠 관리 화면
 * Tamagui 컴포넌트로 전환하여 일관된 스타일 시스템 적용
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { styled, YStack, XStack } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { usePlaceStore } from '@/app/stores/placeStore';
import { useGroupBuyStore } from '@/app/stores/groupBuyStore';
import { TamaguiPlaceCard } from '@/app/components/place';
import { TamaguiEmptyState } from '@/app/design-system';
import { TamaguiText } from '@/app/design-system/components';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import { useInsights } from '@/app/hooks/useInsights';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import type { DataBlock } from '@/app/types/dataBlock';

// ═══════════════════════════════════════════════════════════
// STYLED COMPONENTS
// ═══════════════════════════════════════════════════════════

// Main container
const Container = styled(YStack, {
  name: 'SavedScreenContainer',
  flex: 1,
  backgroundColor: '$background',
});

// Header
const Header = styled(YStack, {
  name: 'SavedScreenHeader',
  paddingHorizontal: '$4',
  paddingBottom: '$3',
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: '$borderColor',
});

// Tab bar
const TabBar = styled(XStack, {
  name: 'SavedScreenTabBar',
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: '$borderColor',
});

// Tab button base
const TabBase = styled(YStack, {
  name: 'SavedScreenTab',
  flex: 1,
  paddingVertical: '$3',
  alignItems: 'center',
  borderBottomWidth: 2,
  borderBottomColor: 'transparent',
  pressStyle: {
    opacity: 0.7,
  },
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function SavedScreen() {
  useAnalytics('Saved');
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'places' | 'content' | 'groupbuy'>('places');
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(refreshTimerRef.current), []);
  const { favoritePlaces, selectPlace, toggleFavorite, isFavorite } = usePlaceStore();
  const { joinedGroupBuyIds } = useGroupBuyStore();
  const placeIds = useMemo(() => favoritePlaces.map((p) => p.id), [favoritePlaces]);
  const { insightsMap } = useInsights(placeIds);

  const trustStats = useMemo(() => {
    const blocks = Array.from(insightsMap.values()).flatMap((insight) =>
      Object.values(insight).filter((b): b is DataBlock => b != null)
    );
    if (blocks.length === 0) {
      return { blockCount: 0, confidence: 0.5, sourceCount: 0 };
    }
    const confidence = blocks.reduce((sum, block) => sum + block.confidence, 0) / blocks.length;
    const sourceCount = new Set(blocks.map((block) => block.source)).size;
    return { blockCount: blocks.length, confidence, sourceCount };
  }, [insightsMap]);

  // ─────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────

  const handlePlacePress = useCallback(
    (place: (typeof favoritePlaces)[0]) => {
      selectPlace(place);
    },
    [selectPlace]
  );

  const handleFavoritePress = useCallback(
    (placeId: string) => {
      toggleFavorite(placeId);
    },
    [toggleFavorite]
  );

  const handleTabPress = useCallback(
    (tab: 'places' | 'content' | 'groupbuy') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (tab === 'groupbuy') {
        navigation.navigate('GroupBuy');
      } else {
        setActiveTab(tab);
      }
    },
    [navigation]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refreshTimerRef.current = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRefreshing(false);
    }, 1000);
  }, []);

  // ─────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: (typeof favoritePlaces)[0] }) => (
      <TamaguiPlaceCard
        place={item}
        insights={insightsMap.get(item.id)}
        onPress={() => handlePlacePress(item)}
        onFavoritePress={() => handleFavoritePress(item.id)}
        isFavorite={isFavorite(item.id)}
      />
    ),
    [handlePlacePress, handleFavoritePress, insightsMap, isFavorite]
  );

  const keyExtractor = useCallback((item: (typeof favoritePlaces)[0]) => item.id, []);

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  const isPlacesActive = activeTab === 'places';
  const isContentActive = activeTab === 'content';

  return (
    <Container>
      {/* Header */}
      {trustStats.blockCount > 0 && (
        <Header style={{ paddingTop: 8 }} accessible={true}>
          <XStack alignItems="center" justifyContent="center" gap="$2">
            <TamaguiText preset="caption" textColor="secondary">
              {COPY.TRUST_ROW(
                trustStats.blockCount,
                trustStats.sourceCount,
                Math.round(trustStats.confidence * 100)
              )}
            </TamaguiText>
            <ConfidenceBadge confidence={trustStats.confidence} size="sm" />
          </XStack>
        </Header>
      )}

      {/* Tab Bar */}
      <TabBar accessibilityRole="tablist">
        <TabBase
          onPress={() => handleTabPress('places')}
          borderBottomColor={isPlacesActive ? '$primary' : 'transparent'}
          accessible={true}
          accessibilityLabel={COPY.A11Y_PLACES_TAB(favoritePlaces.length)}
          accessibilityState={{ selected: isPlacesActive }}
          accessibilityRole="tab"
          accessibilityHint="눌러서 저장한 장소를 확인합니다"
        >
          <TamaguiText
            preset="body"
            textColor={isPlacesActive ? 'brand' : 'secondary'}
            weight={isPlacesActive ? 'semibold' : 'medium'}
          >
            {COPY.TAB_PLACES(favoritePlaces.length)}
          </TamaguiText>
        </TabBase>

        <TabBase
          onPress={() => handleTabPress('content')}
          borderBottomColor={isContentActive ? '$primary' : 'transparent'}
          accessible={true}
          accessibilityLabel={COPY.A11Y_CONTENT_TAB}
          accessibilityState={{ selected: isContentActive }}
          accessibilityRole="tab"
          accessibilityHint="눌러서 저장한 콘텐츠를 확인합니다"
        >
          <TamaguiText
            preset="body"
            textColor={isContentActive ? 'brand' : 'secondary'}
            weight={isContentActive ? 'semibold' : 'medium'}
          >
            {COPY.TAB_CONTENT(0)}
          </TamaguiText>
        </TabBase>

        {/* GroupBuy Tab */}
        <TabBase
          onPress={() => handleTabPress('groupbuy')}
          borderBottomColor="transparent"
          accessible={true}
          accessibilityLabel={`공동구매 탭, ${joinedGroupBuyIds.length}개 참여중`}
          accessibilityRole="tab"
          accessibilityHint="눌러서 공동구매를 확인합니다"
        >
          <XStack alignItems="center" gap="$1">
            <Ionicons name="cart-outline" size={16} color={Colors.primary} />
            <TamaguiText preset="body" textColor="brand" weight="medium">
              공동구매 ({joinedGroupBuyIds.length})
            </TamaguiText>
          </XStack>
        </TabBase>
      </TabBar>

      {/* Content */}
      {activeTab === 'places' ? (
        favoritePlaces.length === 0 ? (
          <TamaguiEmptyState
            icon="heart-outline"
            title={COPY.SAVED_EMPTY_TITLE}
            message={COPY.SAVED_EMPTY_MSG}
            action={{
              label: COPY.EXPLORE_MAP,
              onPress: () => navigation.navigate('Map'),
            }}
          />
        ) : (
          <FlashList
            data={favoritePlaces}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                accessibilityLabel={COPY.A11Y_REFRESH}
              />
            }
            contentContainerStyle={styles.listContent}
            accessibilityRole="list"
            accessibilityLabel={COPY.A11Y_SAVED_LIST}
          />
        )
      ) : (
        <TamaguiEmptyState
          icon="bookmark-outline"
          title={COPY.BOOKMARK_EMPTY_TITLE}
          message={COPY.BOOKMARK_EMPTY_MSG}
        />
      )}
    </Container>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES (minimal - only for FlatList)
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
});

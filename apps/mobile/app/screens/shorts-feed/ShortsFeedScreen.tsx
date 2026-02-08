/**
 * ShortsFeedScreen - TikTok/Reels Style Vertical Video Feed
 *
 * UJUz 독자 기능: 장소 미리보기 숏폼 영상
 * 2026 UJUz 테마 토큰 기반
 */

import { useRef, useCallback } from 'react';
import { Dimensions, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'tamagui';
import { COPY } from '@/app/copy/copy.ko';
import { MOCK_SHORTS } from '@/app/data/mocks';
import type { ShortsScreenNavigationProp } from '@/app/types/navigation';
import { ShortsVideoItem } from './components/ShortsVideoItem';
import { useViewability } from './hooks/useViewability';
import type { ShortsVideo } from './types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ShortsFeedScreen() {
  const navigation = useNavigation<ShortsScreenNavigationProp>();
  const flatListRef = useRef<FlashListRef<ShortsVideo>>(null);
  const theme = useTheme();

  const { currentIndex, handleViewableItemsChanged, viewabilityConfig } = useViewability();

  const renderItem = useCallback(
    ({ item, index }: { item: ShortsVideo; index: number }) => (
      <ShortsVideoItem video={item} isActive={index === currentIndex} navigation={navigation} />
    ),
    [currentIndex, navigation]
  );

  const keyExtractor = useCallback((item: ShortsVideo) => item.id, []);

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.background.val }}
      accessibilityLabel={COPY.A11Y_SHORTS_FEED}
      accessibilityHint={COPY.A11Y_SHORTS_BROWSE_HINT}
    >
      <FlashList
        ref={flatListRef}
        data={MOCK_SHORTS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        accessibilityRole="list"
        accessibilityLabel={`${MOCK_SHORTS.length} shorts videos, swipe up or down to navigate`}
        accessibilityHint={COPY.A11Y_SHORTS_NAVIGATE_HINT}
      />
    </View>
  );
}

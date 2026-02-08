/**
 * SearchScreen - iOS 26 Design
 *
 * Features:
 * - Auto-focus search input
 * - Recent searches
 * - Popular searches
 * - Filter integration
 * - Search results with skeleton loaders
 * - Empty states
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, Keyboard } from 'react-native';
import type { TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceCard, QuickFilter } from '@/app/components/place';
import {
  TamaguiEmptyState,
  TamaguiPlaceCardSkeleton,
  TamaguiText,
  TamaguiInput,
  TamaguiPressableScale,
} from '@/app/design-system';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import { Colors, Layout } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { MOCK_POPULAR_SEARCHES, MOCK_RECENT_SEARCHES } from '@/app/data/mocks';
import { useInsights } from '@/app/hooks/useInsights';
import { useAccessibilityAnnouncement } from '@/app/hooks/useAccessibilityAnnouncement';
import { useSearch } from '@/app/hooks/useSearch';
import { AsyncStorageService } from '@/app/services/storage/AsyncStorageService';
import { usePlaceStore } from '@/app/stores/placeStore';
import type { PlaceWithDistance } from '@/app/types/places';
import type { SearchScreenNavigationProp } from '@/app/types/navigation';
import type { DataBlock } from '@/app/types/dataBlock';

// Storage key
const RECENT_SEARCHES_KEY = 'ujuz.recentSearches';

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const inputRef = useRef<TextInput>(null);
  const { announce } = useAccessibilityAnnouncement();
  const [recentSearches, setRecentSearches] = useState<string[]>(MOCK_RECENT_SEARCHES);

  // Use real search hook
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    isEmpty,
    search,
  } = useSearch({
    debounceMs: 300,
    autoSearch: true,
    minQueryLength: 2,
  });

  const placeIds = useMemo(() => searchResults.map((p) => p.id), [searchResults]);
  const { insightsMap } = useInsights(placeIds);

  const showResults = searchQuery.trim().length >= 2;

  const trustStats = useMemo(() => {
    const blocks = Array.from(insightsMap.values()).flatMap((insight) =>
      Object.values(insight).filter((b): b is DataBlock => b != null)
    );
    if (blocks.length === 0) {
      return { blockCount: 0, confidence: 0.5, sourceCount: 0, updatedLabel: null };
    }
    const confidence = blocks.reduce((sum, block) => sum + block.confidence, 0) / blocks.length;
    const sourceCount = new Set(blocks.map((block) => block.source)).size;
    const latest = blocks.reduce((latestDate, block) => {
      const date = block.updatedAt instanceof Date ? block.updatedAt : new Date(block.updatedAt);
      return date > latestDate ? date : latestDate;
    }, new Date(0));
    const updatedLabel =
      latest.getTime() > 0 ? formatDistanceToNow(latest, { addSuffix: true, locale: ko }) : null;
    return { blockCount: blocks.length, confidence, sourceCount, updatedLabel };
  }, [insightsMap]);

  // Theme-dependent styles
  const styles = useMemo(
    () => ({
      container: {
        flex: 1 as const,
        backgroundColor: theme.background.val,
        paddingTop: insets.top,
      },
      searchHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.borderColor.val,
      },
      trustRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        backgroundColor: theme.surface.val,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
      },
      section: {
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.borderColor.val,
      },
      sectionHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: Layout.screenPadding,
        marginBottom: 12,
      },
      searchItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: Layout.screenPadding,
        paddingVertical: 12,
        gap: 12,
      },
    }),
    [theme, insets.top]
  );

  useEffect(() => {
    // Auto-focus on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load recent searches from storage on mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      const saved = await AsyncStorageService.getItem<string[]>(RECENT_SEARCHES_KEY);
      if (saved && saved.length > 0) {
        setRecentSearches(saved);
      }
    };
    loadRecentSearches();
  }, []);

  // Announce search results for accessibility
  useEffect(() => {
    if (isSearching) {
      announce('loading', COPY.A11Y_SEARCHING(searchQuery));
    } else if (searchResults.length > 0) {
      announce('success', COPY.A11Y_FOUND_RESULTS(searchResults.length));
    } else if (isEmpty) {
      announce('info', COPY.A11Y_NO_RESULTS);
    }
  }, [isSearching, searchResults.length, isEmpty, searchQuery, announce]);

  const handleSearchSubmit = useCallback(async () => {
    if (searchQuery.trim().length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    search(searchQuery);

    // Add to recent searches
    if (!recentSearches.includes(searchQuery)) {
      const updated = [searchQuery, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      await AsyncStorageService.setItem(RECENT_SEARCHES_KEY, updated);
    }
  }, [searchQuery, recentSearches, search]);

  const handleRecentSearchPress = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  const handleClearRecentSearch = useCallback(
    async (query: string) => {
      const updated = recentSearches.filter((q) => q !== query);
      setRecentSearches(updated);
      await AsyncStorageService.setItem(RECENT_SEARCHES_KEY, updated);
    },
    [recentSearches]
  );

  const handleClearAll = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorageService.setItem(RECENT_SEARCHES_KEY, []);
  }, []);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePlacePress = useCallback(
    (place: PlaceWithDistance) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Select place and navigate to Map tab
      usePlaceStore.getState().selectPlace(place);
      navigation.goBack();
      setTimeout(() => {
        navigation.navigate('Main', { screen: 'Map' });
      }, 100);
    },
    [navigation]
  );

  const renderPlaceCard = useCallback(
    ({ item }: { item: PlaceWithDistance }) => (
      <PlaceCard
        place={item}
        insights={insightsMap.get(item.id)}
        onPress={() => handlePlacePress(item)}
      />
    ),
    [insightsMap, handlePlacePress]
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={{ flex: 1 }}>
          <TamaguiInput
            ref={inputRef}
            variant="search"
            placeholder={COPY.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            rightIcon={searchQuery.length > 0 ? 'close-circle' : undefined}
            onRightIconPress={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            accessible={true}
            accessibilityLabel={COPY.A11Y_SEARCH_INPUT}
            accessibilityHint={COPY.A11Y_SEARCH_INPUT_HINT}
          />
        </View>
        <TamaguiPressableScale
          onPress={handleCancel}
          accessibilityLabel={COPY.A11Y_CANCEL_SEARCH}
          accessibilityHint={COPY.A11Y_CANCEL_SEARCH_HINT}
        >
          <TamaguiText preset="bodyLarge" textColor="brand">
            {COPY.CANCEL}
          </TamaguiText>
        </TamaguiPressableScale>
      </View>

      {/* Filters */}
      <QuickFilter />

      {/* Content */}
      {showResults ? (
        // Search Results
        <View style={{ flex: 1 }}>
          {isSearching ? (
            <View style={{ paddingTop: 16 }}>
              <TamaguiPlaceCardSkeleton />
              <TamaguiPlaceCardSkeleton />
              <TamaguiPlaceCardSkeleton />
            </View>
          ) : searchResults.length > 0 ? (
            <View style={{ flex: 1 }}>
              {trustStats.blockCount > 0 && (
                <View style={styles.trustRow}>
                  <TamaguiText preset="caption" weight="semibold" textColor="secondary">
                    {COPY.DATA_BLOCKS_STAT(
                      trustStats.blockCount,
                      trustStats.confidence,
                      trustStats.sourceCount
                    )}
                    {trustStats.updatedLabel ? ` · \uC5C5\uB370\uC774\uD2B8 ${trustStats.updatedLabel}` : ''}
                  </TamaguiText>
                  <ConfidenceBadge confidence={trustStats.confidence} size="sm" />
                </View>
              )}
              <FlashList
                data={searchResults}
                renderItem={renderPlaceCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingVertical: 8 }}
                accessibilityRole="list"
                accessibilityLabel={COPY.A11Y_SEARCH_RESULTS}
              />
            </View>
          ) : (
            <TamaguiEmptyState
              icon="search-outline"
              title={COPY.NO_RESULTS_TITLE}
              message={COPY.NO_RESULTS_MSG(searchQuery)}
              action={{
                label: COPY.ASK_UJU,
                onPress: () => navigation.navigate('Ask'),
              }}
            />
          )}
        </View>
      ) : (
        // Recent & Popular Searches
        <ScrollView style={{ flex: 1 }}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View
              style={styles.section}
              accessibilityRole="list"
              accessibilityLabel={COPY.A11Y_RECENT_SEARCHES}
              accessibilityHint={COPY.A11Y_RECENT_SEARCHES_HINT}
            >
              <View style={styles.sectionHeader}>
                <TamaguiText
                  fontSize={22}
                  weight="semibold"
                  letterSpacing={-0.3}
                  accessibilityRole="header"
                >
                  {COPY.RECENT_SEARCHES}
                </TamaguiText>
                <TamaguiPressableScale
                  onPress={handleClearAll}
                  accessibilityLabel={COPY.A11Y_CLEAR_ALL_RECENT}
                  accessibilityHint={COPY.A11Y_CLEAR_ALL_RECENT_HINT}
                >
                  <TamaguiText preset="bodyLarge" textColor="brand">
                    {COPY.CLEAR_ALL}
                  </TamaguiText>
                </TamaguiPressableScale>
              </View>
              {recentSearches.map((query) => (
                <TamaguiPressableScale
                  key={`recent-${query}`}
                  style={styles.searchItem}
                  onPress={() => handleRecentSearchPress(query)}
                  accessibilityLabel={COPY.A11Y_RECENT_SEARCH_ITEM(query)}
                  accessibilityHint={COPY.A11Y_RECENT_SEARCH_ITEM_HINT}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={theme.textTertiary.val}
                    accessibilityElementsHidden={true}
                  />
                  <TamaguiText preset="bodyLarge" style={{ flex: 1 }}>
                    {query}
                  </TamaguiText>
                  <TamaguiPressableScale
                    onPress={() => handleClearRecentSearch(query)}
                    hapticType="none"
                    style={{ padding: 4 }}
                    accessibilityLabel={COPY.A11Y_REMOVE_RECENT(query)}
                    accessibilityHint={COPY.A11Y_REMOVE_RECENT_HINT}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={theme.textTertiary.val}
                      accessibilityElementsHidden={true}
                    />
                  </TamaguiPressableScale>
                </TamaguiPressableScale>
              ))}
            </View>
          )}

          {/* Popular Searches */}
          <View
            style={styles.section}
            accessibilityRole="list"
            accessibilityLabel={COPY.A11Y_POPULAR_SEARCHES}
            accessibilityHint={COPY.A11Y_POPULAR_SEARCHES_HINT}
          >
            <TamaguiText
              fontSize={22}
              weight="semibold"
              letterSpacing={-0.3}
              accessibilityRole="header"
            >
              {COPY.POPULAR}
            </TamaguiText>
            {MOCK_POPULAR_SEARCHES.map((query) => (
              <TamaguiPressableScale
                key={`popular-${query}`}
                style={styles.searchItem}
                onPress={() => handleRecentSearchPress(query)}
                accessibilityLabel={COPY.A11Y_POPULAR_SEARCH_ITEM(query)}
                accessibilityHint={COPY.A11Y_POPULAR_SEARCH_ITEM_HINT}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color={Colors.primary}
                  accessibilityElementsHidden={true}
                />
                <TamaguiText preset="bodyLarge" style={{ flex: 1 }}>
                  {query}
                </TamaguiText>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={theme.textTertiary.val}
                  accessibilityElementsHidden={true}
                />
              </TamaguiPressableScale>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

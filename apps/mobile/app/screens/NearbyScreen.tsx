/**
 * NearbyScreen.tamagui - 2026 Design System 적용
 *
 * Tamagui + Bento Grid 레이아웃
 * Features:
 * - Bento Grid for AI Picks (Featured Hero + 2 cells)
 * - TamaguiFloatingCard with Spatial Depth
 * - TamaguiGlassCard for premium content
 * - TamaguiChip for context pills
 * - TamaguiText for Variable Typography
 * - FlashList for high-performance scrolling
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { RefreshControl, Dimensions, StyleSheet } from 'react-native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';

// Design System Components
import {
  TamaguiText,
  TamaguiFloatingCard,
  TamaguiGlassCard,
  TamaguiChip,
  TamaguiChipGroup,
} from '@/app/design-system/components';
import { TamaguiEmptyState, TamaguiPlaceCardSkeleton } from '@/app/design-system';

// Existing Components (keep for compatibility)
import { PlaceCard } from '@/app/components/place';
import { useInsights } from '@/app/hooks/useInsights';

// Hooks & Stores
import { usePlaceStore } from '@/app/stores/placeStore';
import { useAccessibilityAnnouncement } from '@/app/hooks/useAccessibilityAnnouncement';
import { useNearbyPlaces } from '@/app/hooks/useNearbyPlaces';

// Types
import type { PlaceWithDistance } from '@/app/types/places';
import type { NearbyScreenNavigationProp } from '@/app/types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 16;
const CELL_GAP = 12;
const AVAILABLE_WIDTH = SCREEN_WIDTH - PADDING * 2;
const HALF_CELL = (AVAILABLE_WIDTH - CELL_GAP) / 2;

// Helper function to get current time of day
function getCurrentTimeOfDay(): TimeType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

// Context types
type WeatherType = 'sunny' | 'rainy' | 'cloudy';
type TimeType = 'morning' | 'afternoon' | 'evening';
type ChildAgeType = 'infant' | 'toddler' | 'child' | 'elementary';

// List item types for FlatList
type ListItem =
  | { type: 'header' }
  | { type: 'contextPills'; weather: WeatherType; time: TimeType; childAge: ChildAgeType }
  | { type: 'aiPicksBento'; places: PlaceWithDistance[] }
  | { type: 'shortsSection' }
  | { type: 'placesHeader' }
  | { type: 'place'; place: PlaceWithDistance }
  | { type: 'skeleton'; id: string };

export default function NearbyScreenTamagui() {
  const navigation = useNavigation<NearbyScreenNavigationProp>();
  const { announce } = useAccessibilityAnnouncement();
  const theme = useTheme();

  // Use the nearby places hook
  const {
    places: nearbyPlaces,
    isLoading,
    error,
    isFromCache,
    refresh,
  } = useNearbyPlaces({
    enabled: true,
    radius: 5000,
    limit: 50,
  });

  const placeIds = useMemo(() => nearbyPlaces.map((p) => p.id), [nearbyPlaces]);
  const { insightsMap } = useInsights(placeIds);

  // AI Picks: top 3 places
  const aiPicks = useMemo(() => nearbyPlaces.slice(0, 3), [nearbyPlaces]);

  // Accessibility announcements
  useEffect(() => {
    if (isLoading && !isFromCache) {
      announce('loading', COPY.A11Y_LOADING_PLACES);
    } else if (nearbyPlaces.length > 0) {
      announce('success', COPY.A11Y_LOADED_PLACES(nearbyPlaces.length, isFromCache));
    } else if (error) {
      const errorMsg = typeof error === 'string' ? error : error.message;
      announce('error', errorMsg || COPY.LOAD_FAILED);
    }
  }, [isLoading, nearbyPlaces.length, error, isFromCache, announce]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handlePlacePress = useCallback(
    (place: PlaceWithDistance) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      usePlaceStore.getState().selectPlace(place);
      navigation.navigate('Map');
    },
    [navigation]
  );

  const handleSeeAllPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Search');
  }, [navigation]);

  const handleShortsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Ask');
  }, [navigation]);

  // Build FlatList data
  const currentTime = useMemo(() => getCurrentTimeOfDay(), []);

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [
      { type: 'header' },
      { type: 'contextPills', weather: 'sunny', time: currentTime, childAge: 'toddler' },
      { type: 'aiPicksBento', places: aiPicks },
      { type: 'shortsSection' },
      { type: 'placesHeader' },
    ];

    if (isLoading && nearbyPlaces.length === 0) {
      items.push(
        { type: 'skeleton', id: 'skeleton-1' },
        { type: 'skeleton', id: 'skeleton-2' },
        { type: 'skeleton', id: 'skeleton-3' }
      );
    } else {
      nearbyPlaces.slice(3).forEach((place) => {
        items.push({ type: 'place', place });
      });
    }

    return items;
  }, [isLoading, nearbyPlaces, aiPicks, currentTime]);

  const renderItem: ListRenderItem<ListItem> = useCallback(
    ({ item }) => {
      switch (item.type) {
        case 'header':
          return <Header />;

        case 'contextPills':
          return (
            <ContextPillsSection weather={item.weather} time={item.time} childAge={item.childAge} />
          );

        case 'aiPicksBento':
          return (
            <AIPicksBentoSection
              places={item.places}
              onPlacePress={handlePlacePress}
              onSeeAllPress={handleSeeAllPress}
            />
          );

        case 'shortsSection':
          return <ShortsSection onSeeAllPress={handleShortsPress} />;

        case 'placesHeader':
          return <PlacesHeader />;

        case 'place':
          return (
            <YStack paddingHorizontal="$4" marginBottom="$3">
              <PlaceCard
                place={item.place}
                insights={insightsMap.get(item.place.id)}
                onPress={() => handlePlacePress(item.place)}
              />
            </YStack>
          );

        case 'skeleton':
          return (
            <YStack paddingHorizontal="$4" marginBottom="$3">
              <TamaguiPlaceCardSkeleton />
            </YStack>
          );

        default:
          return null;
      }
    },
    [handlePlacePress, handleSeeAllPress, handleShortsPress, insightsMap]
  );

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.type === 'place') return item.place.id;
    if (item.type === 'skeleton') return item.id;
    return `${item.type}-${index}`;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.val }]}>
      {error && nearbyPlaces.length === 0 ? (
        (() => {
          const errorMsg = typeof error === 'string' ? error : error.message;
          const isServerError = errorMsg?.includes('Server error') || errorMsg?.includes('500');
          const requestId = (error as any)?.requestId;
          const userMessage = isServerError
            ? '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
            : errorMsg;
          const messageWithId = requestId ? `${userMessage}\n(오류 ID: ${requestId})` : userMessage;

          return (
            <TamaguiEmptyState
              icon="alert-circle-outline"
              title={isServerError ? '서버 오류가 발생했어요' : COPY.LOAD_FAILED}
              message={messageWithId}
              action={{
                label: '다시 시도',
                onPress: refresh,
              }}
            />
          );
        })()
      ) : (
        <FlashList
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={theme.primary.val}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================
// Header Component - 2026 Variable Typography
// ============================================

const Header = React.memo(function Header() {
  return (
    <YStack
      paddingHorizontal="$4"
      paddingTop="$5"
      paddingBottom="$3"
      accessible={true}
      accessibilityRole="header"
    >
      <TamaguiText preset="h1">{COPY.NEARBY_TITLE}</TamaguiText>
      <TamaguiText preset="body" textColor="secondary" marginTop="$1">
        {COPY.NEARBY_SUBTITLE}
      </TamaguiText>
    </YStack>
  );
});

// ============================================
// Context Pills - TamaguiChip 사용
// ============================================

const WEATHER_CONFIG: Record<WeatherType, { label: string; icon: string }> = {
  sunny: { label: COPY.WEATHER_SUNNY, icon: 'sunny-outline' },
  rainy: { label: COPY.WEATHER_RAINY, icon: 'rainy-outline' },
  cloudy: { label: COPY.WEATHER_CLOUDY, icon: 'cloudy-outline' },
};

const TIME_CONFIG: Record<TimeType, { label: string; icon: string }> = {
  morning: { label: COPY.TIME_MORNING, icon: 'sunny-outline' },
  afternoon: { label: COPY.TIME_AFTERNOON, icon: 'partly-sunny-outline' },
  evening: { label: COPY.TIME_EVENING, icon: 'moon-outline' },
};

const AGE_CONFIG: Record<ChildAgeType, { label: string; icon: string }> = {
  infant: { label: COPY.AGE_INFANT, icon: 'happy-outline' },
  toddler: { label: COPY.AGE_TODDLER, icon: 'happy-outline' },
  child: { label: COPY.AGE_CHILD, icon: 'happy-outline' },
  elementary: { label: COPY.AGE_ELEMENTARY, icon: 'happy-outline' },
};

interface ContextPillsProps {
  weather: WeatherType;
  time: TimeType;
  childAge: ChildAgeType;
}

const ContextPillsSection = React.memo(function ContextPillsSection({
  weather,
  time,
  childAge,
}: ContextPillsProps) {
  return (
    <YStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      accessible={true}
      accessibilityLabel={COPY.A11Y_CONTEXT_FILTERS}
    >
      <TamaguiChipGroup gap={8}>
        <TamaguiChip
          label={WEATHER_CONFIG[weather].label}
          leftIcon={WEATHER_CONFIG[weather].icon}
          variant="soft"
          size="sm"
        />
        <TamaguiChip
          label={TIME_CONFIG[time].label}
          leftIcon={TIME_CONFIG[time].icon}
          variant="soft"
          size="sm"
        />
        <TamaguiChip
          label={AGE_CONFIG[childAge].label}
          leftIcon={AGE_CONFIG[childAge].icon}
          variant="soft"
          size="sm"
        />
      </TamaguiChipGroup>
    </YStack>
  );
});

// ============================================
// AI Picks Bento Section - 2026 Bento Grid
// ============================================

interface AIPicksBentoProps {
  places: PlaceWithDistance[];
  onPlacePress: (place: PlaceWithDistance) => void;
  onSeeAllPress: () => void;
}

const AIPicksBentoSection = React.memo(function AIPicksBentoSection({
  places,
  onPlacePress,
  onSeeAllPress,
}: AIPicksBentoProps) {
  const theme = useTheme();

  // Memoize secondary cell style to avoid recreating on every render
  const secondaryCellStyle = useMemo(() => ({ width: HALF_CELL }), []);

  if (places.length === 0) return null;

  const heroPlace = places[0];
  const secondaryPlaces = places.slice(1, 3);

  // Helper to get image URL
  const getImageUrl = (place: PlaceWithDistance) => place.imageUrl || place.thumbnailUrl;

  // Helper to format distance
  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <YStack marginTop="$5" paddingHorizontal="$4">
      {/* Section Header */}
      <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$4">
        <YStack flex={1}>
          <TamaguiText preset="h3">{COPY.AI_PICKS_TITLE}</TamaguiText>
          <TamaguiText preset="caption" textColor="tertiary" marginTop="$1">
            {COPY.AI_PICKS_DESC}
          </TamaguiText>
        </YStack>
        <XStack
          onPress={onSeeAllPress}
          accessible={true}
          accessibilityLabel={COPY.A11Y_SEE_ALL_AI_PICKS}
          accessibilityRole="button"
        >
          <TamaguiText preset="body" textColor="brand">
            {COPY.SEE_ALL}
          </TamaguiText>
        </XStack>
      </XStack>

      {/* Bento Grid Layout */}
      <YStack gap="$3">
        {/* Hero Card (Full Width) */}
        <TamaguiFloatingCard
          depth="floating"
          padding="none"
          onPress={() => onPlacePress(heroPlace)}
          testID="hero-place-card"
        >
          <YStack>
            {/* Hero Image */}
            <YStack
              height={200}
              backgroundColor="$surfaceMuted"
              borderTopLeftRadius="$4"
              borderTopRightRadius="$4"
              overflow="hidden"
            >
              {getImageUrl(heroPlace) ? (
                <Image
                  source={{ uri: getImageUrl(heroPlace) }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : (
                <YStack flex={1} alignItems="center" justifyContent="center">
                  <Ionicons name="image-outline" size={48} color={theme.textTertiary.val} />
                </YStack>
              )}

              {/* AI Badge */}
              <XStack
                position="absolute"
                top="$3"
                left="$3"
                backgroundColor="$primary"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                gap="$1"
                alignItems="center"
              >
                <Ionicons name="sparkles" size={12} color={Colors.white} />
                <TamaguiText preset="caption" style={{ color: Colors.white, fontWeight: '600' }}>
                  {COPY.AI_PICK_BADGE}
                </TamaguiText>
              </XStack>
            </YStack>

            {/* Content */}
            <YStack padding="$3" gap="$2">
              <TamaguiText preset="h4" numberOfLines={1}>
                {heroPlace.name}
              </TamaguiText>

              <XStack gap="$2" alignItems="center">
                <Ionicons
                  name="star"
                  size={14}
                  color={theme.warning.val}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
                <TamaguiText preset="body" textColor="secondary">
                  {heroPlace.rating?.toFixed(1) || 'N/A'}
                </TamaguiText>
                <TamaguiText preset="caption" textColor="tertiary">
                  •
                </TamaguiText>
                <TamaguiText preset="caption" textColor="tertiary">
                  {formatDistance(heroPlace.distance)}
                </TamaguiText>
              </XStack>

              {heroPlace.address && (
                <TamaguiText preset="caption" textColor="tertiary" numberOfLines={1}>
                  {heroPlace.address}
                </TamaguiText>
              )}
            </YStack>
          </YStack>
        </TamaguiFloatingCard>

        {/* Secondary Cards (Half Width) */}
        {secondaryPlaces.length > 0 && (
          <XStack gap="$3">
            {secondaryPlaces.map((place) => (
              <TamaguiFloatingCard
                key={place.id}
                depth="raised"
                padding="none"
                onPress={() => onPlacePress(place)}
                style={secondaryCellStyle}
              >
                <YStack>
                  {/* Thumbnail */}
                  <YStack
                    height={120}
                    backgroundColor="$surfaceMuted"
                    borderTopLeftRadius="$4"
                    borderTopRightRadius="$4"
                    overflow="hidden"
                  >
                    {getImageUrl(place) ? (
                      <Image
                        source={{ uri: getImageUrl(place) }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    ) : (
                      <YStack flex={1} alignItems="center" justifyContent="center">
                        <Ionicons name="image-outline" size={32} color={theme.textTertiary.val} />
                      </YStack>
                    )}
                  </YStack>

                  {/* Content */}
                  <YStack padding="$2" gap="$1">
                    <TamaguiText preset="label" numberOfLines={1}>
                      {place.name}
                    </TamaguiText>
                    <XStack gap="$1" alignItems="center">
                      <Ionicons
                        name="star"
                        size={12}
                        color={theme.warning.val}
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no"
                      />
                      <TamaguiText preset="caption" textColor="secondary">
                        {place.rating?.toFixed(1) || 'N/A'}
                      </TamaguiText>
                    </XStack>
                  </YStack>
                </YStack>
              </TamaguiFloatingCard>
            ))}
          </XStack>
        )}
      </YStack>
    </YStack>
  );
});

// ============================================
// Shorts Section - GlassCard 사용
// ============================================

const SHORTS_DATA = [
  { id: '1', thumbnail: 'https://picsum.photos/200/300?random=30', views: '2.3K' },
  { id: '2', thumbnail: 'https://picsum.photos/200/300?random=31', views: '1.8K' },
  { id: '3', thumbnail: 'https://picsum.photos/200/300?random=32', views: '956' },
];

interface ShortsSectionProps {
  onSeeAllPress: () => void;
}

const ShortsSection = React.memo(function ShortsSection({ onSeeAllPress }: ShortsSectionProps) {
  // Memoize shorts card style
  const shortsCardStyle = useMemo(
    () => ({ width: (AVAILABLE_WIDTH - CELL_GAP * 2) / 3, aspectRatio: 0.6 }),
    []
  );
  return (
    <YStack marginTop="$6" paddingHorizontal="$4">
      {/* Section Header */}
      <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$4">
        <YStack flex={1}>
          <TamaguiText preset="h3">{COPY.COMMUNITY_INSIGHTS}</TamaguiText>
          <TamaguiText preset="caption" textColor="tertiary" marginTop="$1">
            {COPY.COMMUNITY_INSIGHTS_DESC}
          </TamaguiText>
        </YStack>
        <XStack
          onPress={onSeeAllPress}
          accessible={true}
          accessibilityLabel={COPY.A11Y_ASK_UJU}
          accessibilityRole="button"
        >
          <TamaguiText preset="body" textColor="brand">
            {COPY.ACTION_ASK}
          </TamaguiText>
        </XStack>
      </XStack>

      {/* Shorts Cards */}
      <XStack gap="$3">
        {SHORTS_DATA.map((short) => (
          <TamaguiGlassCard
            key={short.id}
            intensity="medium"
            padding="none"
            onPress={() => {}}
            style={shortsCardStyle}
          >
            <YStack flex={1} alignItems="center" justifyContent="center">
              {/* Play Icon */}
              <YStack
                width={48}
                height={48}
                borderRadius={24}
                backgroundColor={Colors.whiteAlpha30 as any}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="play" size={24} color={Colors.white} />
              </YStack>

              {/* Views */}
              <XStack position="absolute" bottom="$2" left="$2" gap="$1" alignItems="center">
                <Ionicons name="eye-outline" size={12} color={Colors.white} />
                <TamaguiText preset="caption" style={{ color: Colors.white }}>
                  {short.views}
                </TamaguiText>
              </XStack>
            </YStack>
          </TamaguiGlassCard>
        ))}
      </XStack>
    </YStack>
  );
});

// ============================================
// Places Header
// ============================================

const PlacesHeader = React.memo(function PlacesHeader() {
  return (
    <YStack marginTop="$6" paddingHorizontal="$4" marginBottom="$4" accessibilityRole="header">
      <TamaguiText preset="h3">{COPY.ALL_NEARBY}</TamaguiText>
    </YStack>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
});

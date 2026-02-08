/**
 * TamaguiSearchBar - Tamagui 기반 SearchBar 컴포넌트
 *
 * 카카오맵 검색바: 상단 고정, 탭하면 검색 화면으로
 * iOS 26 스타일: 깔끔한 디자인, 아이콘 최소화
 *
 * 기존 SearchBar와 동일한 Props 인터페이스 유지
 *
 * 2026 Design System: 테마 토큰 사용, Glassmorphism 지원
 */

import { Platform } from 'react-native';
import { styled, YStack, XStack, Text, GetProps, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { COPY } from '@/app/copy/copy.ko';

// Styled search input container - 테마 토큰 사용
const SearchInput = styled(XStack, {
  name: 'SearchInput',
  alignItems: 'center',
  backgroundColor: '$surfaceMuted',
  borderRadius: '$2',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  gap: '$2',
  pressStyle: {
    opacity: 0.8,
  },
});

// Styled placeholder text - 테마 토큰 사용
const PlaceholderText = styled(Text, {
  name: 'PlaceholderText',
  flex: 1,
  fontSize: 17,
  fontWeight: '400',
  color: '$placeholderColor',
});

// Styled location text - 테마 토큰 사용
const LocationText = styled(Text, {
  name: 'LocationText',
  fontSize: 13,
  fontWeight: '400',
  color: '$textTertiary',
  marginTop: '$1',
  paddingLeft: '$1',
});

// Props types
export interface TamaguiSearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Focus handler (navigates to search screen) */
  onFocus: () => void;
  /** Current location text */
  currentLocation?: string;
  /** Test ID */
  testID?: string;
}

export default function TamaguiSearchBar({
  placeholder = 'Search places, cafes...',
  onFocus,
  currentLocation,
  testID,
}: TamaguiSearchBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFocus();
  };

  // 2026: Glassmorphism 스타일
  return (
    <BlurView
      intensity={80}
      tint="light"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: theme.glassLight.val,
          paddingHorizontal: 16,
          paddingBottom: 8,
          paddingTop: insets.top + 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderColor.val,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: theme.shadowColor.val,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            },
          }),
        },
      ]}
    >
      <YStack testID={testID}>
        {/* Search Input (fake - navigates to search screen) */}
        <SearchInput
          onPress={handlePress}
          accessibilityRole="search"
          accessibilityLabel={placeholder}
          accessibilityHint={COPY.A11Y_OPEN_SEARCH}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.placeholderColor.val}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
          <PlaceholderText>{placeholder}</PlaceholderText>
        </SearchInput>

        {/* Current Location (optional) */}
        {currentLocation && (
          <LocationText
            numberOfLines={1}
            accessibilityRole="text"
            accessibilityLabel={`Current location: ${currentLocation}`}
          >
            {currentLocation}
          </LocationText>
        )}
      </YStack>
    </BlurView>
  );
}

// Re-export types
export type { GetProps };

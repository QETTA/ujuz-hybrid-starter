/**
 * SearchBar Component - Kakao Map Style
 *
 * 카카오맵 검색바: 상단 고정, 탭하면 검색 화면으로
 * iOS 26 스타일: 깔끔한 디자인, 아이콘 최소화
 */

import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from 'tamagui';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

export interface SearchBarProps {
  placeholder?: string;
  onFocus: () => void;
  currentLocation?: string;
}

export default function SearchBar({
  placeholder = 'Search places, cafes...',
  onFocus,
  currentLocation,
}: SearchBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const styles = useMemo(() => ({
    container: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: 'rgba(10, 10, 10, 0.75)',
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor.val,
      overflow: 'hidden' as const,
    },
    searchInput: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.surfaceElevated.val,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    placeholderText: {
      flex: 1,
      fontSize: 17,
      fontWeight: '400' as const,
      color: theme.textTertiary.val,
    },
    locationText: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: theme.textTertiary.val,
      marginTop: 6,
      paddingLeft: 4,
    },
  }), [theme]);

  return (
    <BlurView intensity={80} tint="dark" style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Search Input (fake - navigates to search screen) */}
      <TamaguiPressableScale
        style={styles.searchInput}
        onPress={onFocus}
        hapticType="light"
        accessibilityLabel={placeholder}
        accessibilityHint={COPY.A11Y_OPEN_SEARCH}
      >
        <Ionicons
          name="search"
          size={20}
          color={theme.textTertiary.val}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
        <TamaguiText preset="body" textColor="tertiary" style={styles.placeholderText}>
          {placeholder}
        </TamaguiText>
      </TamaguiPressableScale>

      {/* Current Location (optional) */}
      {currentLocation && (
        <TamaguiText
          preset="caption"
          textColor="tertiary"
          style={styles.locationText}
          numberOfLines={1}
          accessibilityLabel={`Current location: ${currentLocation}`}
        >
          {currentLocation}
        </TamaguiText>
      )}
    </BlurView>
  );
}

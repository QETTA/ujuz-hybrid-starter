/**
 * SearchBar Component - Kakao Map Style
 *
 * 카카오맵 검색바: 상단 고정, 탭하면 검색 화면으로
 * iOS 26 스타일: 깔끔한 디자인, 아이콘 최소화
 */

import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors } from '@/app/constants/Colors';
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
          color={Colors.darkTextTertiary}
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.75)',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkBorder,
    overflow: 'hidden',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  placeholderText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    marginTop: 6,
    paddingLeft: 4,
  },
});

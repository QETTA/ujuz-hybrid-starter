/**
 * SearchBarSkeleton - iOS 26 Style
 *
 * Skeleton loader for SearchBar component
 */

import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Shimmer from './Shimmer';
import { Colors } from '@/app/constants/Colors';

export default function SearchBarSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      accessible={false}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <Shimmer width="100%" height={44} borderRadius={12} style={styles.searchBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.iosSecondaryBackground,
  },
  searchBar: {
    marginHorizontal: 0,
  },
});

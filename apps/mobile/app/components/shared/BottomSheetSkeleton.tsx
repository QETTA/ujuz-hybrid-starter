/**
 * BottomSheetSkeleton - iOS 26 Style
 *
 * Skeleton loader for Bottom Sheet content
 */

import { View, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';
import { Colors } from '@/app/constants/Colors';

export default function BottomSheetSkeleton() {
  return (
    <View
      style={styles.container}
      accessible={false}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      {/* Handle */}
      <View style={styles.handle}>
        <Shimmer width={40} height={4} borderRadius={2} />
      </View>

      {/* Image Gallery */}
      <Shimmer width="100%" height={200} borderRadius={0} style={styles.image} />

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Shimmer width="70%" height={28} borderRadius={4} style={styles.title} />

        {/* Rating */}
        <Shimmer width="50%" height={18} borderRadius={4} style={styles.rating} />

        {/* Address */}
        <Shimmer width="80%" height={16} borderRadius={4} style={styles.address} />

        {/* Description */}
        <Shimmer width="100%" height={60} borderRadius={8} style={styles.description} />

        {/* Buttons */}
        <View style={styles.buttons}>
          <Shimmer width="48%" height={48} borderRadius={12} />
          <Shimmer width="48%" height={48} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  image: {
    marginBottom: 16,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 12,
  },
  rating: {
    marginBottom: 8,
  },
  address: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});

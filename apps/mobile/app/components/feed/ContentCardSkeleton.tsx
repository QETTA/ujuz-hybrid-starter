import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Layout, Shadows } from '@/app/constants';

export default function ContentCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={styles.card}
      accessible={false}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.thumbnail, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.title, { opacity }]} />
        <Animated.View style={[styles.titleSecondLine, { opacity }]} />

        <View style={styles.authorRow}>
          <Animated.View style={[styles.authorAvatar, { opacity }]} />
          <Animated.View style={[styles.author, { opacity }]} />
        </View>

        <Animated.View style={[styles.description, { opacity }]} />
        <Animated.View style={[styles.descriptionSecondLine, { opacity }]} />

        <View style={styles.footer}>
          <Animated.View style={[styles.stat, { opacity }]} />
          <Animated.View style={[styles.stat, { opacity }]} />
          <Animated.View style={[styles.date, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    marginHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    padding: Layout.spacing.md,
  },
  title: {
    height: 18,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Layout.spacing.xs,
  },
  titleSecondLine: {
    height: 18,
    width: '60%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Layout.spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
  },
  author: {
    flex: 1,
    height: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
  },
  description: {
    height: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Layout.spacing.xs,
  },
  descriptionSecondLine: {
    height: 14,
    width: '70%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Layout.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  stat: {
    width: 50,
    height: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
  },
  date: {
    width: 60,
    height: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
    marginLeft: 'auto',
  },
});

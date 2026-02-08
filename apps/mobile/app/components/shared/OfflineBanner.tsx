/**
 * OfflineBanner - Offline status indicator
 *
 * Shows when device is offline
 */

import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsConnected } from '@/app/hooks/useNetworkStatus';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

export default function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const isConnected = useIsConnected();
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (!isConnected) {
      // Show banner
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      // Hide banner
      translateY.value = withTiming(-100, { duration: 300 });
    }
  }, [isConnected, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[styles.container, { paddingTop: insets.top + 8 }, animatedStyle]}
      pointerEvents="box-none"
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel="인터넷 연결 없음. 오프라인 상태입니다"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.content} pointerEvents="none">
        <Ionicons
          name="cloud-offline"
          size={16}
          color={Colors.white}
          accessibilityElementsHidden={true}
        />
        <TamaguiText preset="body" textColor="inverse" weight="semibold" style={styles.text}>
          {COPY.NETWORK_OFFLINE}
        </TamaguiText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: Colors.iosSystemRed,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});

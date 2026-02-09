/**
 * TabNavigator — Phase 10 Polished (Dark-First, 5 Tabs)
 *
 * Tabs: 홈 | 지도 | Ask(AI Orb) | 딜 | 저장
 * Features: theme-reactive, icon bounce, active dot, live deal badge
 */

import { useEffect, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from 'tamagui';
import {
  MapScreen,
  SavedScreen,
  GroupBuyScreen,
  HomeScreenPeerSync,
} from '@/app/screens';
import { useGroupBuyStore } from '@/app/stores';
import { getTabLabel } from '@/app/utils/accessibility';
import { TamaguiText } from '@/app/design-system';
import { Colors, withAlpha } from '@/app/constants/Colors';
import { ujuzColors } from '@/tamagui.config';

const Tab = createBottomTabNavigator();

// ══════════════════════════════════════════════════════════
// Animated Tab Bar Icon — Bounce + Active Dot
// ══════════════════════════════════════════════════════════

function AnimatedTabBarIcon({
  name,
  nameOutline,
  color,
  focused,
  size = 22,
}: {
  name: string;
  nameOutline: string;
  color: string;
  focused: boolean;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(focused ? 1 : 0);
  const dotScale = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (focused) {
      // Bounce in
      scale.value = withSequence(
        withSpring(0.85, { damping: 15, stiffness: 400 }),
        withSpring(1.05, { damping: 12, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 250 }),
      );
      dotOpacity.value = withSpring(1, { damping: 15, stiffness: 200 });
      dotScale.value = withSpring(1, { damping: 12, stiffness: 300 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      dotOpacity.value = withTiming(0, { duration: 200 });
      dotScale.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={tabIconStyles.container}>
      <Animated.View style={iconStyle}>
        <Ionicons
          name={(focused ? name : nameOutline) as any}
          size={size}
          color={color}
        />
      </Animated.View>
      <Animated.View
        style={[
          tabIconStyles.activeDot,
          { backgroundColor: color },
          dotStyle,
        ]}
      />
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});

// ══════════════════════════════════════════════════════════
// Deal Count Badge — Live indicator
// ══════════════════════════════════════════════════════════

function DealCountBadge({ count }: { count: number }) {
  const theme = useTheme();

  if (count <= 0) return null;

  return (
    <View
      style={[
        badgeStyles.container,
        { backgroundColor: theme.deal.val },
      ]}
    >
      <TamaguiText style={[badgeStyles.text, { color: theme.textInverse.val }]}>
        {count > 99 ? '99+' : count}
      </TamaguiText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
});

// ══════════════════════════════════════════════════════════
// Siri-style AI Ask Button — Multi-color blob morphing
// ══════════════════════════════════════════════════════════

const ORB_SIZE = 54;
const BLOB_SIZE = 34;

// Siri 오브는 의도적 다크 테마 — 시스템 테마와 무관
const BLOB_COLORS = [
  withAlpha(ujuzColors.primary500, 0.70), // mint (brand)
  withAlpha('#3B82F6', 0.60),             // blue
  withAlpha('#8B5CF6', 0.55),             // purple
  withAlpha('#EC4899', 0.50),             // pink
];

function SiriBlob({
  color,
  phaseOffset,
  radiusX,
  radiusY,
  duration,
  progress,
}: {
  color: string;
  phaseOffset: number;
  radiusX: number;
  radiusY: number;
  duration: number;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const angle = (progress.value / duration) * 2 * Math.PI + phaseOffset;
    const tx = Math.cos(angle) * radiusX;
    const ty = Math.sin(angle) * radiusY;
    const s = 0.85 + Math.sin(angle * 1.3) * 0.2;
    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale: s }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: BLOB_SIZE,
          height: BLOB_SIZE,
          borderRadius: BLOB_SIZE / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function SiriAskButton({ onPress }: { onPress?: (...args: any[]) => void }) {
  const progress = useSharedValue(0);
  const breathe = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(6000, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
    breathe.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress, breathe, glow]);

  const containerBreathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.97, 1.03]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.15, 0.35]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.25]) }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={orbStyles.container}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="AI에게 질문하기"
      accessibilityHint="AI 질문 화면으로 이동합니다"
    >
      <Animated.View style={[orbStyles.glowHalo, glowStyle]} />
      <Animated.View style={[orbStyles.orbOuter, containerBreathStyle]}>
        <View style={orbStyles.orbInner}>
          <SiriBlob color={BLOB_COLORS[0]} phaseOffset={0} radiusX={8} radiusY={10} duration={6000} progress={progress} />
          <SiriBlob color={BLOB_COLORS[1]} phaseOffset={Math.PI * 0.5} radiusX={10} radiusY={7} duration={6000} progress={progress} />
          <SiriBlob color={BLOB_COLORS[2]} phaseOffset={Math.PI} radiusX={7} radiusY={9} duration={6000} progress={progress} />
          <SiriBlob color={BLOB_COLORS[3]} phaseOffset={Math.PI * 1.5} radiusX={9} radiusY={8} duration={6000} progress={progress} />
          <View style={orbStyles.iconCenter}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>
      <TamaguiText style={orbStyles.label}>Ask</TamaguiText>
    </Pressable>
  );
}

const orbStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -16,
    width: 72,
  },
  glowHalo: {
    position: 'absolute',
    top: -4,
    width: ORB_SIZE + 16,
    height: ORB_SIZE + 16,
    borderRadius: (ORB_SIZE + 16) / 2,
    backgroundColor: withAlpha(ujuzColors.primary500, 0.12),
  },
  orbOuter: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    shadowColor: ujuzColors.primary500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  orbInner: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: 'rgba(18, 18, 20, 0.88)', // Intentional: dark orb background
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.whiteAlpha10,
  },
  iconCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.whiteAlpha70,
    marginTop: 5,
    letterSpacing: 0.3,
  },
});

// ══════════════════════════════════════════════════════════
// Dummy screen for center Ask tab (navigates to modal)
// ══════════════════════════════════════════════════════════

function AskPlaceholder() {
  const theme = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.background.val }} />;
}

// ══════════════════════════════════════════════════════════
// Tab Navigator
// ══════════════════════════════════════════════════════════

export default function TabNavigator() {
  const theme = useTheme();
  const activeDeals = useGroupBuyStore(
    (s) => s.groupBuys.filter((gb) => gb.status === 'active').length,
  );

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary.val,
        tabBarInactiveTintColor: theme.textTertiary.val,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: theme.surfaceMuted.val,
          }),
          borderTopColor: theme.borderColor.val,
          borderTopWidth: 0.5,
          height: Platform.select({ ios: 88, android: 64 }),
          paddingTop: Platform.select({ ios: 8, android: 6 }),
          paddingBottom: Platform.select({ ios: 34, android: 8 }),
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={{ flex: 1 }} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenPeerSync}
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon
              name="home"
              nameOutline="home-outline"
              color={color}
              focused={focused}
            />
          ),
          tabBarAccessibilityLabel: getTabLabel('Home', '홈'),
        }}
      />

      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: '지도',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon
              name="map"
              nameOutline="map-outline"
              color={color}
              focused={focused}
            />
          ),
          tabBarAccessibilityLabel: getTabLabel('Map', '지도'),
        }}
      />

      {/* Center: Siri-style AI Ask Orb */}
      <Tab.Screen
        name="AskTab"
        component={AskPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Ask');
          },
        })}
        options={{
          title: '',
          tabBarButton: (props) => <SiriAskButton onPress={props.onPress} />,
          tabBarAccessibilityLabel: getTabLabel('Ask', 'AI 질문'),
        }}
      />

      <Tab.Screen
        name="Deals"
        component={GroupBuyScreen}
        options={{
          title: '딜',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <AnimatedTabBarIcon
                name="pricetag"
                nameOutline="pricetag-outline"
                color={color}
                focused={focused}
              />
              <DealCountBadge count={activeDeals} />
            </View>
          ),
          tabBarAccessibilityLabel: getTabLabel(
            'Deals',
            activeDeals > 0
              ? `딜 ${activeDeals}개 진행중`
              : '딜',
          ),
        }}
      />

      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          title: '저장',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon
              name="bookmark"
              nameOutline="bookmark-outline"
              color={color}
              focused={focused}
            />
          ),
          tabBarAccessibilityLabel: getTabLabel('Saved', '저장'),
        }}
      />
    </Tab.Navigator>
  );
}

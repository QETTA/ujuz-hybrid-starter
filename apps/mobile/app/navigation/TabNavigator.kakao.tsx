/**
 * TabNavigator - Dark Mode First (5 Tabs)
 *
 * Tabs: 홈 | 지도 | Ask(AI) | 저장 | 마이
 * 2026 Design: Dark-first, Siri-like center AI orb button
 */

import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { HomeScreenPeerSync, SavedScreen, MyPageScreen } from '@/app/screens';
import MapScreenKakao from '@/app/screens/MapScreen.kakao';
import { getTabLabel } from '@/app/utils/accessibility';
import { Colors } from '@/app/constants';
import { TamaguiText } from '@/app/design-system';

const Tab = createBottomTabNavigator();

// ── Dummy screen for center tab (user never sees this) ──

function AskPlaceholder() {
  return <View style={{ flex: 1, backgroundColor: Colors.darkBg }} />;
}

// ══════════════════════════════════════════════════════════
// Siri-style AI Ask Button — Multi-color blob morphing
// ══════════════════════════════════════════════════════════

const ORB_SIZE = 54;
const BLOB_SIZE = 34;

// Siri palette — 4 blobs that orbit and blend
const BLOB_COLORS = [
  'rgba(93, 219, 158, 0.70)', // mint (brand)
  'rgba(59, 130, 246, 0.60)', // blue
  'rgba(139, 92, 246, 0.55)', // purple
  'rgba(236, 72, 153, 0.50)', // pink
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
    // Continuous rotation for blob orbits
    progress.value = withRepeat(
      withTiming(6000, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    );
    // Breathing scale
    breathe.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    // Outer glow pulse
    glow.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress, breathe, glow]);

  const containerBreathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.97, 1.03]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.15, 0.35]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.25]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={orbStyles.container}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="AI에게 질문하기"
      accessibilityHint="AI 질문 화면으로 이동합니다"
    >
      {/* Outer glow halo */}
      <Animated.View style={[orbStyles.glowHalo, glowStyle]} />

      {/* Main orb with blobs */}
      <Animated.View style={[orbStyles.orbOuter, containerBreathStyle]}>
        {/* Dark glass base */}
        <View style={orbStyles.orbInner}>
          {/* Orbiting color blobs */}
          <SiriBlob
            color={BLOB_COLORS[0]}
            phaseOffset={0}
            radiusX={8}
            radiusY={10}
            duration={6000}
            progress={progress}
          />
          <SiriBlob
            color={BLOB_COLORS[1]}
            phaseOffset={Math.PI * 0.5}
            radiusX={10}
            radiusY={7}
            duration={6000}
            progress={progress}
          />
          <SiriBlob
            color={BLOB_COLORS[2]}
            phaseOffset={Math.PI}
            radiusX={7}
            radiusY={9}
            duration={6000}
            progress={progress}
          />
          <SiriBlob
            color={BLOB_COLORS[3]}
            phaseOffset={Math.PI * 1.5}
            radiusX={9}
            radiusY={8}
            duration={6000}
            progress={progress}
          />

          {/* Center icon */}
          <View style={orbStyles.iconCenter}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>

      {/* Label */}
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
    backgroundColor: 'rgba(93, 219, 158, 0.12)',
  },
  orbOuter: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    // Glow shadow
    shadowColor: '#5DDB9E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  orbInner: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: 'rgba(18, 18, 20, 0.88)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 5,
    letterSpacing: 0.3,
  },
});

// ══════════════════════════════════════════════════════════
// Tab Navigator
// ══════════════════════════════════════════════════════════

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: 'rgba(15, 15, 15, 0.95)',
          }),
          borderTopColor: Colors.darkBorder,
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
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
          tabBarAccessibilityLabel: getTabLabel('Home', '홈'),
        }}
      />

      <Tab.Screen
        name="Map"
        component={MapScreenKakao}
        options={{
          title: '지도',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={22} color={color} />
          ),
          tabBarAccessibilityLabel: getTabLabel('Map', '지도'),
        }}
      />

      {/* ── Center: Siri-style AI Ask Orb ── */}
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
        name="Saved"
        component={SavedScreen}
        options={{
          title: '저장',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={22} color={color} />
          ),
          tabBarAccessibilityLabel: getTabLabel('Saved', '저장'),
        }}
      />

      <Tab.Screen
        name="My"
        component={MyPageScreen}
        options={{
          title: '마이',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
          tabBarAccessibilityLabel: getTabLabel('My', '마이페이지'),
        }}
      />
    </Tab.Navigator>
  );
}

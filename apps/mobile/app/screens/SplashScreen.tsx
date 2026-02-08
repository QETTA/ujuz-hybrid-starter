/**
 * SplashScreen - Mobile-only entry
 *
 * 2026 UJUz 테마 토큰 기반
 * Spring scale-in + shimmer sweep 애니메이션
 */

import { useEffect, useRef, useMemo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from 'tamagui';
import { Colors } from '@/app/constants';
import { TamaguiText } from '@/app/design-system';
import { useOnboardingStore } from '@/app/stores/onboardingStore';
import type { RootStackNavigationProp } from '@/app/types/navigation';

// Keep splash screen visible while we determine where to navigate
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function SplashScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { hasHydrated, hasOnboarded, locationPermission } = useOnboardingStore();
  const hasNavigated = useRef(false);
  const theme = useTheme();

  // Spring scale-in animation
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const shimmerTranslateX = useSharedValue(-200);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 600 });
    taglineOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    shimmerTranslateX.value = withDelay(
      600,
      withTiming(200, { duration: 800, easing: Easing.inOut(Easing.ease) })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  // Fallback: Force navigation after 3 seconds even if hydration fails
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasNavigated.current) {
        console.warn('[SplashScreen] Hydration timeout - forcing navigation');
        hasNavigated.current = true;
        ExpoSplashScreen.hideAsync().catch(() => {});
        navigation.replace('Onboarding', undefined);
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [navigation]);

  // Normal flow: Navigate when hydrated
  useEffect(() => {
    if (!hasHydrated || hasNavigated.current) return;

    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;
      ExpoSplashScreen.hideAsync().catch(() => {});

      if (!hasOnboarded) {
        navigation.replace('Onboarding', undefined);
        return;
      }
      if (locationPermission !== 'granted') {
        navigation.replace('Permissions', undefined);
        return;
      }
      navigation.replace('Main', { screen: 'Home' });
    }, 1200);

    return () => clearTimeout(timer);
  }, [hasHydrated, hasOnboarded, locationPermission, navigation]);

  const styles = useMemo(
    () => ({
      container: {
        flex: 1 as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      logoWrap: {
        alignItems: 'center' as const,
        gap: 10,
      },
      logo: {
        fontSize: 42,
        fontWeight: '800' as const,
        fontStyle: 'italic' as const,
        color: theme.textPrimary.val,
        letterSpacing: -1.8,
      },
      tagline: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: theme.textSecondary.val,
      },
      footer: {
        position: 'absolute' as const,
        bottom: 40,
      },
      footerText: {
        fontSize: 11,
        color: theme.textTertiary.val,
      },
    }),
    [theme]
  );

  return (
    <LinearGradient
      colors={[...Colors.darkGradient] as [string, string, ...string[]]}
      style={styles.container}
    >
      <View style={styles.logoWrap}>
        <Animated.View style={logoAnimatedStyle}>
          <TamaguiText preset="h1" textColor="primary" weight="bold" style={styles.logo}>
            Ujuz
          </TamaguiText>
        </Animated.View>
        <Animated.View style={taglineAnimatedStyle}>
          <TamaguiText
            preset="caption"
            textColor="secondary"
            weight="semibold"
            style={styles.tagline}
          >
            Trust → Recommend → Execute
          </TamaguiText>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TamaguiText preset="caption" textColor="tertiary" style={styles.footerText}>
          mobile-only intelligence
        </TamaguiText>
      </View>
    </LinearGradient>
  );
}

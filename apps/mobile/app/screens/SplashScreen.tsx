/**
 * SplashScreen - 모바일 전용 엔트리
 *
 * 2026 UJUz 테마 토큰 기반
 * Spring scale-in + FadeInDown 애니메이션
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
  withTiming,
  FadeIn,
  FadeInDown,
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

  // Spring scale-in animation for logo
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
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
        gap: 14,
      },
      logo: {
        fontSize: 56,
        fontWeight: '800' as const,
        fontStyle: 'italic' as const,
        color: theme.textPrimary.val,
        letterSpacing: -2.2,
      },
      tagline: {
        fontSize: 15,
        fontWeight: '600' as const,
        color: theme.textSecondary.val,
        letterSpacing: 0.3,
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
            우쥬
          </TamaguiText>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <TamaguiText
            preset="caption"
            textColor="secondary"
            weight="semibold"
            style={styles.tagline}
          >
            우리 아이 입학 지도
          </TamaguiText>
        </Animated.View>
      </View>

      <Animated.View style={styles.footer} entering={FadeIn.delay(800).duration(500)}>
        <TamaguiText preset="caption" textColor="tertiary" style={styles.footerText}>
          오늘 갈 곳·입학·대기 알림까지
        </TamaguiText>
      </Animated.View>
    </LinearGradient>
  );
}

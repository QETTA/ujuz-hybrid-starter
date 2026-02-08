/**
 * SplashScreen - Mobile-only entry
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ExpoSplashScreen from 'expo-splash-screen';
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

  return (
    <LinearGradient
      colors={[...Colors.darkGradient] as [string, string, ...string[]]}
      style={styles.container}
    >
      <View style={styles.logoWrap}>
        <TamaguiText preset="h1" textColor="primary" weight="bold" style={styles.logo}>
          Ujuz
        </TamaguiText>
        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.tagline}
        >
          Trust → Recommend → Execute
        </TamaguiText>
      </View>

      <View style={styles.footer}>
        <TamaguiText preset="caption" textColor="tertiary" style={styles.footerText}>
          mobile-only intelligence
        </TamaguiText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    fontStyle: 'italic',
    color: Colors.darkTextPrimary,
    letterSpacing: -1.8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkTextSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
  },
});

/**
 * PermissionsScreen - location + notifications
 * Design System: TamaguiText, TamaguiPressableScale
 *
 * 2026 UJUz 테마 토큰 기반
 */

import { useState, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { LocationService } from '@/app/services/location/LocationService';
import { useOnboardingStore } from '@/app/stores/onboardingStore';
import type { RootStackNavigationProp } from '@/app/types/navigation';

const stagger = (i: number) =>
  FadeInDown.delay(i * 80)
    .springify()
    .damping(16);

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useTheme();
  const { setLocationPermission, setNotificationPermission } = useOnboardingStore();

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  const handleEnableLocation = async () => {
    setLocationLoading(true);
    const granted = await LocationService.requestPermissions();
    setLocationPermission(granted ? 'granted' : 'denied');
    setLocationGranted(granted);
    setLocationLoading(false);
  };

  const handleEnableNotifications = () => {
    setNotificationPermission('granted');
    setNotifGranted(true);
  };

  const handleContinue = () => {
    navigation.replace('Main', { screen: 'Home' });
  };

  const styles = useMemo(
    () => ({
      container: {
        flex: 1 as const,
        backgroundColor: theme.background.val,
        paddingHorizontal: Layout.screenPadding,
      },
      title: {
        marginBottom: 6,
      },
      subtitle: {
        marginBottom: 20,
      },
      card: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.surface.val,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      },
      row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 12,
      },
      textBlock: {
        flex: 1,
      },
      cardTitle: {
        marginBottom: 4,
      },
      actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: Colors.primary,
      },
      actionButtonDisabled: {
        opacity: 0.6,
      },
      actionButtonGranted: {
        backgroundColor: Colors.success,
      },
      cta: {
        marginTop: 12,
        height: 52,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      skip: {
        marginTop: 12,
        alignItems: 'center' as const,
      },
    }),
    [theme]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Animated.View entering={stagger(0)}>
        <TamaguiText preset="h1" textColor="primary" weight="bold" style={styles.title}>
          권한 설정
        </TamaguiText>
        <TamaguiText preset="caption" textColor="secondary" style={styles.subtitle}>
          더 정확한 추천을 위해 필요해요
        </TamaguiText>
      </Animated.View>

      <Animated.View entering={stagger(1)} style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={22} color={Colors.primary} />
          <View style={styles.textBlock}>
            <TamaguiText preset="body" textColor="primary" weight="bold" style={styles.cardTitle}>
              위치
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary">
              주변 장소와 대기 정보를 보여줘요
            </TamaguiText>
          </View>
          <TamaguiPressableScale
            onPress={handleEnableLocation}
            disabled={locationLoading || locationGranted}
            hapticType="medium"
            style={[
              styles.actionButton,
              locationLoading && styles.actionButtonDisabled,
              locationGranted && styles.actionButtonGranted,
            ]}
            accessibilityLabel="위치 권한 허용"
            accessibilityHint="위치 권한을 요청합니다"
          >
            <TamaguiText preset="caption" textColor="inverse" weight="bold">
              {locationGranted ? '완료' : locationLoading ? '요청 중' : '허용'}
            </TamaguiText>
          </TamaguiPressableScale>
        </View>
      </Animated.View>

      <Animated.View entering={stagger(2)} style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
          <View style={styles.textBlock}>
            <TamaguiText preset="body" textColor="primary" weight="bold" style={styles.cardTitle}>
              알림
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary">
              딜/대기 알림을 받을 수 있어요
            </TamaguiText>
          </View>
          <TamaguiPressableScale
            onPress={handleEnableNotifications}
            disabled={notifGranted}
            hapticType="medium"
            style={[styles.actionButton, notifGranted && styles.actionButtonGranted]}
            accessibilityLabel="알림 권한 허용"
            accessibilityHint="알림 권한을 허용합니다"
          >
            <TamaguiText preset="caption" textColor="inverse" weight="bold">
              {notifGranted ? '완료' : '허용'}
            </TamaguiText>
          </TamaguiPressableScale>
        </View>
      </Animated.View>

      <Animated.View entering={stagger(3)}>
        <TamaguiPressableScale
          onPress={handleContinue}
          hapticType="medium"
          style={styles.cta}
          accessibilityLabel="시작하기 버튼"
          accessibilityHint="앱을 시작합니다"
        >
          <TamaguiText preset="bodyLarge" textColor="inverse" weight="bold">
            시작하기
          </TamaguiText>
        </TamaguiPressableScale>

        <TamaguiPressableScale
          onPress={handleContinue}
          style={styles.skip}
          accessibilityLabel="나중에 설정"
          accessibilityHint="권한 설정을 건너뜁니다"
        >
          <TamaguiText preset="caption" textColor="tertiary">
            나중에 설정
          </TamaguiText>
        </TamaguiPressableScale>
      </Animated.View>
    </View>
  );
}

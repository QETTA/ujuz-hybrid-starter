/**
 * PermissionsScreen - location + notifications
 * Design System: TamaguiText, TamaguiPressableScale
 * Dark-first 2026
 */

import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { LocationService } from '@/app/services/location/LocationService';
import { useOnboardingStore } from '@/app/stores/onboardingStore';
import type { RootStackNavigationProp } from '@/app/types/navigation';

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { setLocationPermission, setNotificationPermission } = useOnboardingStore();

  const [locationLoading, setLocationLoading] = useState(false);

  const handleEnableLocation = async () => {
    setLocationLoading(true);
    const granted = await LocationService.requestPermissions();
    setLocationPermission(granted ? 'granted' : 'denied');
    setLocationLoading(false);
  };

  const handleEnableNotifications = () => {
    setNotificationPermission('granted');
  };

  const handleContinue = () => {
    navigation.replace('Main', { screen: 'Home' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <TamaguiText preset="h1" textColor="primary" weight="bold" style={styles.title}>
        권한 설정
      </TamaguiText>
      <TamaguiText preset="caption" textColor="secondary" style={styles.subtitle}>
        더 정확한 추천을 위해 필요해요
      </TamaguiText>

      <View style={styles.card}>
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
            disabled={locationLoading}
            hapticType="medium"
            style={[styles.actionButton, locationLoading && styles.actionButtonDisabled]}
            accessibilityLabel="위치 권한 허용"
            accessibilityHint="위치 권한을 요청합니다"
          >
            <TamaguiText preset="caption" textColor="inverse" weight="bold">
              {locationLoading ? '요청 중' : '허용'}
            </TamaguiText>
          </TamaguiPressableScale>
        </View>
      </View>

      <View style={styles.card}>
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
            hapticType="medium"
            style={styles.actionButton}
            accessibilityLabel="알림 권한 허용"
            accessibilityHint="알림 권한을 허용합니다"
          >
            <TamaguiText preset="caption" textColor="inverse" weight="bold">
              허용
            </TamaguiText>
          </TamaguiPressableScale>
        </View>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
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
    backgroundColor: Colors.darkSurface,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  cta: {
    marginTop: 12,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    marginTop: 12,
    alignItems: 'center',
  },
});

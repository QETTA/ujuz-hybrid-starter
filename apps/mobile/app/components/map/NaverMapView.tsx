/**
 * NaverMapView - Platform Router
 *
 * Development Build: @mj-studio/react-native-naver-map (네이티브 SDK)
 * Expo Go: 폴백 리스트 UI
 * Web: 웹 폴백
 *
 * client_id가 없으면 네이티브 맵 마운트를 차단하여
 * IllegalViewOperationException 크래시를 방지합니다.
 */

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import NaverMapFallback from './NaverMapFallback';
import NaverMapFallbackWeb from './NaverMapFallbackWeb';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Check if Naver Map client_id is configured (prevents native crash with empty key)
const naverMapPlugin = (Constants.expoConfig?.plugins ?? []).find(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (p: any): p is [string, Record<string, unknown>] =>
    Array.isArray(p) && p[0] === '@mj-studio/react-native-naver-map'
);
const hasValidClientId = !!(naverMapPlugin?.[1]?.client_id);

// Conditionally import native Naver Map (will fail in Expo Go)
let NaverMapViewNative: typeof NaverMapFallback;

if (Platform.OS !== 'web' && !isExpoGo && hasValidClientId) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    NaverMapViewNative = require('./NaverMapView.native').default;
  } catch {
    NaverMapViewNative = NaverMapFallback;
  }
} else {
  NaverMapViewNative = NaverMapFallback;
}

const NaverMapView =
  Platform.OS === 'web'
    ? NaverMapFallbackWeb
    : isExpoGo || !hasValidClientId
      ? NaverMapFallback
      : NaverMapViewNative;

export default NaverMapView;

// Re-export types
export type { MapLngLat, MapboxLayers, MapViewProps } from './types';

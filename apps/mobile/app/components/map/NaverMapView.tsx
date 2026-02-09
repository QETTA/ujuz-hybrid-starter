/**
 * NaverMapView - Platform Router
 *
 * Development Build: 네이버 지도 네이티브 렌더링
 * Expo Go: 폴백 리스트 UI
 * Web: 웹 폴백
 */

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import NaverMapFallback from './NaverMapFallback';
import NaverMapFallbackWeb from './NaverMapFallbackWeb';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Conditionally import native Naver Map (will fail in Expo Go)
let NaverMapViewNative: typeof NaverMapFallback;

if (Platform.OS !== 'web' && !isExpoGo) {
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
  Platform.OS === 'web' ? NaverMapFallbackWeb : isExpoGo ? NaverMapFallback : NaverMapViewNative;

export default NaverMapView;

// Re-export types
export type { MapLngLat, MapboxLayers, MapViewProps } from './types';

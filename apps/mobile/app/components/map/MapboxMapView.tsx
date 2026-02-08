import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Platform-specific imports
import MapboxMapViewWeb from './MapboxMapView.web';
import MapboxMapViewExpo from './MapboxMapView.expo';

// Check if running in Expo Go (no native modules available)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Conditionally import native map (will fail in Expo Go)
let MapboxMapViewNative: typeof MapboxMapViewExpo;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    // Dynamic require to avoid crash in Expo Go
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    MapboxMapViewNative = require('./MapboxMapView.native').default;
  } catch {
    // Fallback if native module fails to load
    MapboxMapViewNative = MapboxMapViewExpo;
  }
} else {
  MapboxMapViewNative = MapboxMapViewExpo;
}

// Select appropriate map component
const MapboxMapView =
  Platform.OS === 'web' ? MapboxMapViewWeb : isExpoGo ? MapboxMapViewExpo : MapboxMapViewNative;

export default MapboxMapView;

// Re-export types for convenience
export type { MapLngLat, MapboxLayers } from './MapboxMapView.expo';

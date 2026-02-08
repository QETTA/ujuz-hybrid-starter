import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Import implementations
import * as Web from './mapbox.web';
import * as ExpoFallback from './mapbox.expo';

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Conditionally import native (will fail in Expo Go)
let Native: typeof ExpoFallback;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    Native = require('./mapbox.native');
  } catch {
    Native = ExpoFallback;
  }
} else {
  Native = ExpoFallback;
}

// Select implementation based on platform and environment
const impl = Platform.OS === 'web' ? Web : isExpoGo ? ExpoFallback : Native;

export const bootstrapMapbox = impl.bootstrapMapbox;
export const getMapboxStyleURL = impl.getMapboxStyleURL;

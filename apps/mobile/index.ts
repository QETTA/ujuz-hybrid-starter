import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

import App from './App';

// Suppress known harmless dev-only warnings
LogBox.ignoreLogs([
  'No font size found', // Tamagui fontsParsed $ prefix mismatch
  'Must call import', // @tamagui/native/setup-zeego (unused native menu)
]);
if (__DEV__) {
  const _warn = console.warn;
  const SUPPRESSED_PREFIXES = [
    'No font size found', // Tamagui $ prefix mismatch
    'Must call import', // Zeego native menu setup
  ];
  console.warn = (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && SUPPRESSED_PREFIXES.some((p) => msg.startsWith(p))) return;
    _warn(...args);
  };
}

registerRootComponent(App);

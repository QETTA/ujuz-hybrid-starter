import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

import App from './App';

// Tamagui fontsParsed adds $ prefix to keys ($md), but styled variant size="md"
// passes unprefixed "md" → indexOf mismatch → false warning (dev-only, harmless)
LogBox.ignoreLogs(['No font size found']);
if (__DEV__) {
  const _warn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('No font size found')) return;
    _warn(...args);
  };
}

registerRootComponent(App);

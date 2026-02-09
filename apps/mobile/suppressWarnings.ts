/**
 * Dev warning suppression — must be imported BEFORE App to catch
 * module-level warnings (e.g. Tamagui/zeego) during import resolution.
 */
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'No font size found', // Tamagui fontsParsed $ prefix mismatch
  'Must call import', // @tamagui/native/setup-zeego (unused native menu)
]);

if (__DEV__) {
  const _warn = console.warn;
  const SUPPRESSED_SUBSTRINGS = [
    'No font size found', // Tamagui $ prefix mismatch
    'setup-zeego', // Zeego native menu setup
  ];
  console.warn = (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && SUPPRESSED_SUBSTRINGS.some((s) => msg.includes(s))) return;
    _warn(...args);
  };
}

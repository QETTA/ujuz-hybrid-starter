/**
 * UJUz Mobile - App Theme Hook
 *
 * System detection + AsyncStorage persistence + toggle
 */

import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@ujuz_theme_preference';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeMode(stored);
      }
      setIsLoaded(true);
    });
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme ?? 'dark') : themeMode;

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, [resolvedTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  return {
    themeMode,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    isLoaded,
    toggleTheme,
    setTheme,
  };
}

/**
 * UJUz Mobile - Theme Provider
 *
 * Wraps TamaguiProvider with theme persistence and system detection.
 */

import React, { createContext, useContext } from 'react';
import { TamaguiProvider } from 'tamagui';
import { StatusBar } from 'expo-status-bar';
import config from '@/tamagui.config';
import { useAppTheme, type ThemeMode } from '@/app/hooks/useAppTheme';

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'system',
  resolvedTheme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useAppTheme();

  if (!theme.isLoaded) {
    return null; // Splash screen stays visible until loaded
  }

  return (
    <ThemeContext.Provider value={theme}>
      <TamaguiProvider config={config} defaultTheme={theme.resolvedTheme}>
        {children}
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </TamaguiProvider>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;

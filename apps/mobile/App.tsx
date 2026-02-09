import React from 'react';
import { useFonts } from 'expo-font';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from '@/app/navigation/AppNavigator';
import ErrorBoundary from '@/app/components/shared/ErrorBoundary';
import OfflineBanner from '@/app/components/shared/OfflineBanner';
import { ToastProvider } from '@/app/components/shared/Toast';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { initializeMonitoring } from '@/app/services/monitoring';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Regular.otf'),
    InterMedium: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterSemiBold: require('@tamagui/font-inter/otf/Inter-SemiBold.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  React.useEffect(() => {
    initializeMonitoring();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <OfflineBanner />
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
          </ToastProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

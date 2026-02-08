import React from 'react';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import config from './tamagui.config';
import AppNavigator from '@/app/navigation/AppNavigator';
import ErrorBoundary from '@/app/components/shared/ErrorBoundary';
import OfflineBanner from '@/app/components/shared/OfflineBanner';
import { ToastProvider } from '@/app/components/shared/Toast';
import { bootstrapMapbox } from '@/app/services/mapbox';
import { initializeMonitoring } from '@/app/services/monitoring';

export default function App() {
  React.useEffect(() => {
    initializeMonitoring();

    const result = bootstrapMapbox();
    if (!result.ok) {
      console.warn('[App] Mapbox bootstrap failed:', result.reason);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <TamaguiProvider config={config} defaultTheme="dark">
        <SafeAreaProvider>
          <ToastProvider>
            <OfflineBanner />
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
            <StatusBar style="light" />
          </ToastProvider>
        </SafeAreaProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

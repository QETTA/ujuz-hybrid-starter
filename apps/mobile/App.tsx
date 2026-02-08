import React from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from '@/app/navigation/AppNavigator';
import ErrorBoundary from '@/app/components/shared/ErrorBoundary';
import OfflineBanner from '@/app/components/shared/OfflineBanner';
import { ToastProvider } from '@/app/components/shared/Toast';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
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

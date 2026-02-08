/**
 * Toast Component - 토스 2026 스타일
 * Design System: TamaguiText, TamaguiPressableScale
 *
 * 사용법:
 * const { showToast } = useToast();
 * showToast({ type: 'success', message: '저장되었습니다' });
 */

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';

// Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number; // ms, default 3000
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

// Context
const ToastContext = createContext<ToastContextValue | null>(null);

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Icon mapping
const TOAST_ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
};

// TODO: Migrate Colors.darkTextPrimary to theme tokens.
// These are in a module-level config object outside React components,
// so hooks (useTheme) cannot be used here. Consider restructuring
// TOAST_COLORS to accept theme values at render time.
// Color mapping (토스 스타일) - semantic colors
const TOAST_COLORS: Record<ToastType, { bg: string; icon: string; text: string }> = {
  success: {
    bg: Colors.successMintBg,
    icon: Colors.iosSystemGreen,
    text: Colors.darkTextPrimary,
  },
  error: {
    bg: Colors.iosSystemRedAlpha10,
    icon: Colors.iosSystemRed,
    text: Colors.darkTextPrimary,
  },
  info: {
    bg: Colors.primaryAlpha10,
    icon: Colors.primary,
    text: Colors.darkTextPrimary,
  },
  warning: {
    bg: Colors.iosSystemOrangeAlpha10,
    icon: Colors.iosSystemOrange,
    text: Colors.darkTextPrimary,
  },
};

// Toast Component
function ToastView({ config, onHide }: { config: ToastConfig; onHide: () => void }) {
  const insets = useSafeAreaInsets();
  const colors = TOAST_COLORS[config.type];
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Haptic feedback
    if (config.type === 'error' || config.type === 'success') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Auto dismiss
    const duration = config.duration ?? 3000;
    timeoutRef.current = setTimeout(onHide, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [config, onHide]);

  const handleActionPress = useCallback(() => {
    config.action?.onPress();
    onHide();
  }, [config.action, onHide]);

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(15)}
      exiting={SlideOutUp.duration(200)}
      style={[
        styles.container,
        {
          top: insets.top + 8,
          backgroundColor: colors.bg,
        },
      ]}
    >
      <TamaguiPressableScale style={styles.content} onPress={onHide} hapticType="light">
        <Ionicons
          name={TOAST_ICONS[config.type]}
          size={22}
          color={colors.icon}
          style={styles.icon}
        />
        <TamaguiText
          preset="body"
          weight="medium"
          style={[styles.message, { color: colors.text }]}
          numberOfLines={2}
        >
          {config.message}
        </TamaguiText>
        {config.action && (
          <TamaguiPressableScale onPress={handleActionPress} hapticType="light">
            <TamaguiText
              preset="body"
              weight="semibold"
              style={[styles.action, { color: colors.icon }]}
            >
              {config.action.label}
            </TamaguiText>
          </TamaguiPressableScale>
        )}
      </TamaguiPressableScale>
    </Animated.View>
  );
}

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);

  const showToast = useCallback((config: ToastConfig) => {
    setToast(config);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && <ToastView config={toast} onHide={hideToast} />}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    lineHeight: 20,
  },
  action: {
    marginLeft: 12,
  },
});

export default ToastProvider;

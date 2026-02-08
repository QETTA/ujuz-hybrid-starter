/**
 * Jest Setup
 * Global test configuration and mocks
 */

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  EventEmitter: jest.fn(),
  NativeModule: jest.fn(),
  requireNativeModule: jest.fn(),
  requireNativeViewManager: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({
    status: 'granted',
  })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.5665,
      longitude: 126.9780,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  })),
  watchPositionAsync: jest.fn(),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock tamagui to avoid "Missing theme" errors in tests
jest.mock('tamagui', () => {
  const { View, Text } = require('react-native');
  const React = require('react');
  const createMockComponent = (name) =>
    React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(View, { ...props, ref }, children)
    );

  return {
    styled: (Component) => Component,
    useTheme: () => ({
      background: { val: '#fff' },
      color: { val: '#000' },
    }),
    TamaguiProvider: ({ children }) => children,
    Theme: ({ children }) => children,
    XStack: createMockComponent('XStack'),
    YStack: createMockComponent('YStack'),
    Stack: createMockComponent('Stack'),
    Text: React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(Text, { ...props, ref }, children)
    ),
    SizableText: React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(Text, { ...props, ref }, children)
    ),
    Paragraph: React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(Text, { ...props, ref }, children)
    ),
    H1: React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(Text, { ...props, ref }, children)
    ),
    GetProps: {},
    getTokens: () => ({}),
    getToken: () => 0,
    createTamagui: (config) => config,
    createTokens: (tokens) => tokens,
  };
});

// Mock @tamagui/* sub-packages used in tamagui.config.ts
jest.mock('@tamagui/font-inter', () => ({
  createInterFont: () => ({}),
}));

jest.mock('@tamagui/shorthands', () => ({
  shorthands: {},
}));

jest.mock('@tamagui/config/v3', () => ({
  tokens: { color: {}, size: {}, space: {}, radius: {}, zIndex: {} },
}));

jest.mock('@tamagui/animations-react-native', () => ({
  createAnimations: (anims) => anims,
}));

// Mock expo-blur
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  const React = require('react');
  return {
    BlurView: React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(View, { ...props, ref }, children)
    ),
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  const React = require('react');
  return {
    LinearGradient: React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(View, { ...props, ref }, children)
    ),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const React = require('react');
  return {
    __esModule: true,
    default: { createAnimatedComponent: (Component) => Component, View },
    useSharedValue: (val) => ({ value: val }),
    useAnimatedStyle: (fn) => fn(),
    withRepeat: (val) => val,
    withSequence: (val) => val,
    withTiming: (val) => val,
    withSpring: (val) => val,
    FadeIn: { duration: () => ({ delay: () => ({}) }) },
    FadeOut: { duration: () => ({}) },
    SlideInRight: { duration: () => ({}) },
    Layout: { duration: () => ({}) },
    Easing: { bezier: () => ({}) },
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  const React = require('react');
  return {
    GestureHandlerRootView: ({ children }) => children,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    NativeViewGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeGesture: View,
    FlatList: View,
    gestureHandlerRootHOC: (comp) => comp,
    Directions: {},
    Gesture: {
      Pan: () => {
        const g = {};
        const chain = () => new Proxy(g, { get: () => chain });
        return chain();
      },
      Tap: () => {
        const g = {};
        const chain = () => new Proxy(g, { get: () => chain });
        return chain();
      },
    },
    GestureDetector: ({ children }) => {
      const React = require('react');
      return React.isValidElement(children) ? children : null;
    },
  };
});

// Tamagui/@tamagui/web expects browser-ish globals in some code paths
global.window = global.window || global;
global.addEventListener = global.addEventListener || jest.fn();
global.removeEventListener = global.removeEventListener || jest.fn();
global.window.addEventListener = global.window.addEventListener || global.addEventListener;
global.window.removeEventListener = global.window.removeEventListener || global.removeEventListener;
global.window.matchMedia =
  global.window.matchMedia ||
  (() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

// Mock timers
jest.useFakeTimers();

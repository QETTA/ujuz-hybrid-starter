import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  MapScreen,
  SavedScreen,
  GroupBuyScreen,
  AskScreen,
  HomeScreenPeerSync,
} from '@/app/screens';
import { Colors } from '@/app/constants';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.navActive,
        tabBarInactiveTintColor: Colors.navInactive,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            // Note: No exact whiteAlpha92 token available in Colors.ts
            android: 'rgba(255, 255, 255, 0.92)',
          }),
          borderTopColor: Platform.select({
            ios: 'transparent',
            android: Colors.border,
          }),
          borderTopWidth: Platform.select({
            ios: 0,
            android: 1,
          }),
          elevation: Platform.select({
            ios: 0,
            android: 8,
          }),
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="light" style={{ flex: 1 }} />
          ) : null,
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomColor: Colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: Colors.text,
        },
      }}
    >
      <Tab.Screen
        name="Uju"
        component={HomeScreenPeerSync}
        options={{
          title: 'Ujuz',
          headerShown: false, // Custom header in screen
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Ujuz 홈',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: '지도',
          headerShown: false, // Custom header in screen
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
          tabBarAccessibilityLabel: '지도',
        }}
      />
      <Tab.Screen
        name="Deals"
        component={GroupBuyScreen}
        options={{
          title: '딜',
          headerShown: false, // Custom header in screen
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: '딜',
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          title: '저장됨',
          headerShown: false, // Custom header in screen
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" size={size} color={color} />,
          tabBarAccessibilityLabel: '저장된 장소',
        }}
      />
      <Tab.Screen
        name="Ask"
        component={AskScreen}
        options={{
          title: '질문',
          headerShown: false, // Custom header in screen
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: '우주봇에게 질문',
        }}
      />
    </Tab.Navigator>
  );
}

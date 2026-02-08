/**
 * Navigation Types - Type-safe navigation throughout the app
 */

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';

// Tab Navigator Params
export type TabParamList = {
  Home: undefined;
  Map: undefined;
  AskTab: undefined;
  Saved: undefined;
  My: undefined;
};

// Root Stack Navigator Params
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Permissions: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  Search: undefined;
  GroupBuy: { id?: string } | undefined;
  PeerGroups: undefined;
  PeerGroupDetail: { groupId: string };
  PeerGroupMembers: { groupId: string };
  PeerGroupJoin: { inviteCode: string };
  CreatePeerGroup: undefined;
  ProfileEdit: undefined;
  PlaceDetail: { id: string } | undefined;
  Report: undefined;
  Feedback: undefined;
  Ask: undefined;
  // Auth screens
  Login: undefined;
  SignUp: undefined;
  // Core feature screens
  AdmissionScore: { facilityId?: string } | undefined;
  AdmissionResult: { resultId: string };
  TOAlertSettings: undefined;
  NotificationHistory: undefined;
  Subscription: undefined;
  Payment: { planId: string };
};

// Navigation Props for Stack Screens
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Navigation Props for Tab Screens
export type TabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Specific screen navigation props
export type MapScreenNavigationProp = TabNavigationProp;
export type NearbyScreenNavigationProp = TabNavigationProp;
export type ShortsScreenNavigationProp = TabNavigationProp;
export type SavedScreenNavigationProp = TabNavigationProp;
export type MyPageScreenNavigationProp = TabNavigationProp;
export type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Search'>;

// Declare global type for useNavigation hook
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

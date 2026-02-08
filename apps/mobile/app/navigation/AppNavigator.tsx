import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import SearchScreen from '@/app/screens/SearchScreen';
import GroupBuyScreen from '@/app/screens/GroupBuyScreen';
import SplashScreen from '@/app/screens/SplashScreen';
import OnboardingScreen from '@/app/screens/OnboardingScreen';
import PermissionsScreen from '@/app/screens/PermissionsScreen';
import PlaceDetailScreen from '@/app/screens/PlaceDetailScreen';
import ReportScreen from '@/app/screens/ReportScreen';
import FeedbackScreen from '@/app/screens/FeedbackScreen';
import { PeerGroupDetailScreen } from '../screens/PeerGroupDetailScreen';
import AdmissionScoreScreen from '@/app/screens/AdmissionScoreScreen';
import AdmissionResultScreen from '@/app/screens/AdmissionResultScreen';
import TOAlertSettingsScreen from '@/app/screens/TOAlertSettingsScreen';
import NotificationHistoryScreen from '@/app/screens/NotificationHistoryScreen';
import SubscriptionScreen from '@/app/screens/SubscriptionScreen';
import PaymentScreen from '@/app/screens/PaymentScreen';
import AskScreen from '@/app/screens/AskScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />

        {/* Search Modal */}
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />

        {/* GroupBuy Screen */}
        <Stack.Screen
          name="GroupBuy"
          component={GroupBuyScreen}
          options={{
            presentation: 'card',
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="PeerGroupDetail"
          component={PeerGroupDetailScreen}
          options={{
            headerShown: true,
            headerBackTitle: '모임',
          }}
        />

        <Stack.Screen
          name="PlaceDetail"
          component={PlaceDetailScreen}
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="Report"
          component={ReportScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />

        {/* Core Feature Screens */}
        <Stack.Screen
          name="AdmissionScore"
          component={AdmissionScoreScreen}
          options={{ presentation: 'card', headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AdmissionResult"
          component={AdmissionResultScreen}
          options={{ presentation: 'card', headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="TOAlertSettings"
          component={TOAlertSettingsScreen}
          options={{ presentation: 'card', headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="NotificationHistory"
          component={NotificationHistoryScreen}
          options={{ presentation: 'card', headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ presentation: 'card', headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Ask"
          component={AskScreen}
          options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

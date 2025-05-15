import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import MatchesScreen from '../screens/MatchesScreen';
import MeetupsScreen from '../screens/MeetupsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DealsScreen from '../screens/DealsScreen';
import FeedScreen from '../screens/FeedScreen';
import ChatScreen from '../screens/ChatScreen';
import DirectChatScreen from '../screens/DirectChatScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { MatchingProvider } from '../contexts/MatchingContext';
import { ConversationProvider } from '../contexts/ConversationContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { MeetupsProvider } from '../contexts/MeetupsContext';
import { colors, createShadow } from '../components/ui/theme';
import Navigation from '../components/Navigation';
import { NavigationContainer } from '@react-navigation/native';

// Define app navigation types
type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
  ProfileSetup: undefined;
  DirectChat: DirectChatParams;
  EventDetails: { id: string };
  Settings: undefined;
  NotFound: undefined;
};

type MainTabParamList = {
  Dashboard: undefined;
  Matches: undefined;
  Meetups: undefined;
  Messages: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Define types for the route params
type DirectChatParams = {
  id: string;
  name?: string;
};

// Create typed navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  // Use our custom Navigation component instead of the default tab bar
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Dashboard"
      tabBar={() => <Navigation />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Meetups" component={MeetupsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Custom header title component with text shadow
const HeaderTitle = ({ children }: { children: string }) => (
  <Text style={styles.headerTitle}>
    {children}
  </Text>
);

function RootNavigator() {
  const { user, loading } = useAuth();
  
  if (loading) {
    // TODO: Replace with actual loading screen
    return null;
  }
  
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.wood.lightest,
        },
      }}
    >
      {user ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="DirectChat" 
            component={DirectChatScreen} 
            options={({ route }) => ({ 
              title: route.params?.name || 'Chat',
              headerShown: true,
              headerTitle: (props) => <HeaderTitle>{props.children as string}</HeaderTitle>,
              headerStyle: {
                backgroundColor: colors.wood.medium,
                ...createShadow(4),
              },
              headerTintColor: colors.onPrimary,
            })} 
          />
          <Stack.Screen 
            name="EventDetails" 
            component={EventDetailsScreen} 
            options={{ 
              title: 'Event Details',
              headerShown: true,
              headerTitle: (props) => <HeaderTitle>{props.children as string}</HeaderTitle>,
              headerStyle: {
                backgroundColor: colors.wood.medium,
                ...createShadow(4),
              },
              headerTintColor: colors.onPrimary,
            }} 
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ 
              title: 'Settings',
              headerShown: true,
              headerTitle: (props) => <HeaderTitle>{props.children as string}</HeaderTitle>,
              headerStyle: {
                backgroundColor: colors.wood.medium,
                ...createShadow(4),
              },
              headerTintColor: colors.onPrimary,
            }} 
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="ProfileSetup" 
            component={ProfileSetupScreen} 
            options={{ 
              headerShown: true,
              title: 'Complete Your Profile',
              headerTitle: (props) => <HeaderTitle>{props.children as string}</HeaderTitle>,
              headerStyle: {
                backgroundColor: colors.wood.medium,
                ...createShadow(4),
              },
              headerTintColor: colors.onPrimary,
            }} 
          />
        </>
      )}
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Not Found' }} />
    </Stack.Navigator>
  );
}

// Styles
const styles = StyleSheet.create({
  headerTitle: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

// Combined application of all providers
const AppNavigatorWithProviders: React.FC = () => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <MatchingProvider>
          <ConversationProvider>
            <NotificationProvider>
              <MeetupsProvider>
                <RootNavigator />
              </MeetupsProvider>
            </NotificationProvider>
          </ConversationProvider>
        </MatchingProvider>
      </ProfileProvider>
    </AuthProvider>
  );
};

// Main navigator that wraps with NavigationContainer
const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <AppNavigatorWithProviders />
    </NavigationContainer>
  );
};

export default AppNavigator; 
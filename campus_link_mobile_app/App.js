import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform, SafeAreaView, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/components/ui/theme';

// Configure notifications only for native platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export default function App() {
  useEffect(() => {
    // Only run notifications code on native platforms
    if (Platform.OS !== 'web') {
      (async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Enable notifications to stay updated!');
        }
      })();
      
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        Alert.alert('Notification', notification.request.content.body || 'You have a new notification!');
      });
      
      return () => subscription.remove();
    }
  }, []);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

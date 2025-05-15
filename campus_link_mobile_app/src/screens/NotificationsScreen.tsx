import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationCard from '../components/NotificationCard';
import { useNavigation } from '@react-navigation/native';

const NotificationsScreen = () => {
  const { notifications, fetchNotifications, loading } = useNotifications();
  const navigation = useNavigation();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // TODO: Implement markAsRead, markAllAsRead, and unreadCount in NotificationContext for full parity with web app
  // const handleNotificationAction = (type: string, relatedId: string | null) => { ... }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Notifications</Text>
        {/* TODO: Add unread badge and 'Mark all as read' button when context supports it */}
      </View>
      {loading && notifications.length === 0 ? (
        <ActivityIndicator />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium">No notifications</Text>
          <Text variant="bodyMedium" style={{ color: '#888' }}>
            When you receive notifications, they'll appear here.
          </Text>
        </View>
      ) : (
        notifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            // TODO: Add onPress to mark as read and handle actions when context supports it
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { marginRight: 8 },
  emptyState: { alignItems: 'center', marginTop: 48 },
});

export default NotificationsScreen; 
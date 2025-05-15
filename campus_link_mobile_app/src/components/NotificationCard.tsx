import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from './ui/theme';

interface NotificationCardProps {
  notification: any;
  onPress?: () => void;
}

const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
  if (!notification) return null;

  // Get the right icon based on notification type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'match':
        return <MaterialCommunityIcons name="account-multiple" size={24} color={colors.primary} />;
      case 'meetup':
        return <MaterialCommunityIcons name="coffee" size={24} color={colors.secondary} />;
      case 'message':
        return <MaterialCommunityIcons name="message-text" size={24} color={colors.info} />;
      case 'system':
        return <MaterialCommunityIcons name="bell" size={24} color={colors.muted} />;
      default:
        return <MaterialCommunityIcons name="bell" size={24} color={colors.muted} />;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        // Less than an hour
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
      } else if (diffInHours < 24) {
        // Less than a day
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffInHours < 48) {
        // Yesterday
        return 'Yesterday';
      } else {
        // More than 2 days ago
        return date.toLocaleDateString();
      }
    } catch (e) {
      return '';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        notification.is_read ? styles.read : styles.unread,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {getNotificationIcon()}
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>{notification.content}</Text>
        <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={20} 
        color={colors.muted} 
        style={styles.chevron} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  read: {
    backgroundColor: 'transparent',
  },
  unread: {
    backgroundColor: `${colors.primary}10`, // 10% opacity
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.surface}`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  message: {
    fontSize: 14,
    color: colors.onBackground,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: colors.muted,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default NotificationCard; 
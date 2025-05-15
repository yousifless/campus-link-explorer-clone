import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, colors } from './ui';

interface MessageCardProps {
  conversation: any;
  onOpen: () => void;
}

const MessageCard = ({ conversation, onOpen }: MessageCardProps) => {
  if (!conversation || !conversation.other_user) return null;

  const otherUser = conversation.other_user;
  const lastMessage = conversation.last_message || 'No messages yet';
  const lastMessageTime = conversation.last_message_time || '';

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    // If it's a timestamp, convert to readable time
    if (timeString.includes(':')) {
      return timeString;
    }
    
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onOpen}
      activeOpacity={0.7}
    >
      <Avatar
        uri={otherUser.avatar_url}
        initials={`${otherUser.first_name?.[0] || ''}${otherUser.last_name?.[0] || ''}`}
        size="md"
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name}>
            {otherUser.first_name} {otherUser.last_name}
          </Text>
          <Text style={styles.time}>{formatTime(lastMessageTime)}</Text>
        </View>
        <Text numberOfLines={1} style={styles.message}>
          {lastMessage}
        </Text>
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={24} 
        color={colors.muted} 
        style={styles.chevron} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
  },
  time: {
    fontSize: 12,
    color: colors.muted,
  },
  message: {
    fontSize: 14,
    color: colors.muted,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default MessageCard; 
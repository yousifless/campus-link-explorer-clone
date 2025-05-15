import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button, colors } from './ui';

interface MeetupCardProps {
  meetup: any;
  onView?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

const MeetupCard = ({ meetup, onView, onAccept, onDecline }: MeetupCardProps) => {
  if (!meetup) return null;

  // Helper function to get the other user (not the current user)
  const getOtherUser = () => {
    // In real app, compare with current user ID
    // For now, we'll assume sender is the other user
    return meetup.sender || meetup.receiver || {};
  };

  const otherUser = getOtherUser();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString || 'Date not specified';
    }
  };

  // Get status badge based on meetup status
  const getStatusBadge = () => {
    switch (meetup.status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        style={styles.container}
        onPress={onView}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar
              uri={otherUser.avatar_url}
              initials={`${otherUser.first_name?.[0] || ''}${otherUser.last_name?.[0] || ''}`}
              size="md"
            />
            <View style={styles.userDetails}>
              <Text style={styles.name}>
                {otherUser.first_name} {otherUser.last_name}
              </Text>
              <Text style={styles.subtitle}>{formatDate(meetup.date)}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            {getStatusBadge()}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.muted} />
            <Text style={styles.location}>{meetup.location || 'Location not specified'}</Text>
          </View>

          {meetup.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {meetup.notes}
            </Text>
          )}
        </View>

        {meetup.status === 'pending' && (
          <View style={styles.actions}>
            {onAccept && (
              <Button
                variant="default"
                size="sm"
                onPress={onAccept}
                style={styles.actionButton}
              >
                Accept
              </Button>
            )}
            {onDecline && (
              <Button
                variant="outline"
                size="sm"
                onPress={onDecline}
                style={styles.actionButton}
              >
                Decline
              </Button>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  container: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  content: {
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  location: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.onBackground,
  },
  notes: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
});

export default MeetupCard; 
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button, colors } from './ui';

interface MatchCardProps {
  profile: any;
  onMessage: () => void;
  onViewProfile?: () => void;
}

const MatchCard = ({ profile, onMessage, onViewProfile }: MatchCardProps) => {
  if (!profile) return null;

  // Format interests and languages for display
  const getInterests = () => {
    if (!profile.interests || !Array.isArray(profile.interests)) return [];
    return profile.interests.slice(0, 3);
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity 
        style={styles.container}
        onPress={onViewProfile}
        activeOpacity={0.7}
      >
        <Avatar
          uri={profile.avatar_url}
          initials={`${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`}
          size="md"
        />
        <View style={styles.content}>
          <Text style={styles.name}>
            {profile.first_name} {profile.last_name}
            {profile.is_verified && (
              <MaterialCommunityIcons 
                name="check-decagram" 
                size={16} 
                color={colors.primary} 
                style={styles.verifiedIcon} 
              />
            )}
          </Text>
          <Text style={styles.subtitle}>
            {profile.university_name || profile.university_id || 'Not specified'}
          </Text>
          
          <View style={styles.tagsContainer}>
            {getInterests().map((interest, index) => (
              <Badge 
                key={`interest-${index}`} 
                variant="outline" 
                style={styles.tag}
              >
                {typeof interest === 'string' ? interest : interest?.name || ''}
              </Badge>
            ))}
          </View>
        </View>
        
        <View style={styles.actions}>
          <Button
            variant="outline"
            size="sm"
            onPress={onMessage}
            leftIcon={<MaterialCommunityIcons name="message-text" size={16} color={colors.primary} />}
          >
            Message
          </Button>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  container: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 6,
    marginBottom: 4,
  },
  actions: {
    marginLeft: 8,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
});

export default MatchCard; 
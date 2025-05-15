import React from 'react';
import { View, ScrollView, StyleSheet, ImageBackground, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfile } from '../contexts/ProfileContext';
import { useMatching } from '../contexts/MatchingContext';
import { useConversations } from '../contexts/ConversationContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useMeetups } from '../contexts/MeetupsContext';
import { Card, Button, Avatar, Badge, colors, createShadow, spacing, radius } from '../components/ui';
import MatchCard from '../components/MatchCard';
import MeetupCard from '../components/MeetupCard';
import MessageCard from '../components/MessageCard';
import NotificationCard from '../components/NotificationCard';
import AppIcon from '../components/ui/icons/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const { profile, loading: profileLoading } = useProfile();
  const { matches, loading: matchesLoading } = useMatching();
  const { conversations, loading: convLoading } = useConversations();
  const { notifications, loading: notifLoading } = useNotifications();
  const { meetups, loading: meetupsLoading } = useMeetups();

  // Simple profile completion: count filled fields
  const profileFields = profile ? Object.values(profile).filter(Boolean).length : 0;
  const totalProfileFields = profile ? Object.keys(profile).length : 0;
  const profileCompletion = totalProfileFields ? Math.round((profileFields / totalProfileFields) * 100) : 0;

  // Get university display name from profile
  const getUniversityDisplay = () => {
    if (!profile) return 'No university';
    // Use university_id as the fallback
    return profile.university_id || 'No university';
  };

  // Render loading placeholder
  const renderLoading = (type: string) => (
    <View style={styles.loadingContainer}>
      <MaterialCommunityIcons name="timer-sand" size={24} color={colors.muted} />
      <Text style={styles.loadingText}>Loading {type}...</Text>
    </View>
  );

  // Render empty state with icon
  const renderEmpty = (message: string, icon: string) => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name={icon} size={36} color={colors.muted} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Wood texture background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={[
            colors.gradients.woodVertical[0],
            colors.gradients.woodVertical[1],
            colors.gradients.woodVertical[2]
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Overlay pattern for wood grain texture */}
          <View style={styles.woodGrainOverlay} />
        </LinearGradient>
        
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <AppIcon size={60} variant="full" />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}!
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Your campus connections dashboard
            </Text>
          </View>
          
          {/* User avatar with notifications badge */}
          <View style={styles.avatarContainer}>
            <Avatar 
              uri={profile?.avatar_url}
              initials={profile?.first_name?.[0] || '?'}
              size="md"
              woodFrame
              onPress={() => navigation?.navigate?.('Profile')}
              status="online"
            />
            {notifications.length > 0 && (
              <Badge 
                variant="wood" 
                style={styles.notificationBadge}
              >
                {notifications.length > 9 ? '9+' : notifications.length.toString()}
              </Badge>
            )}
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Card variant="wood" style={styles.card}>
            <Card.Header 
              title="Profile Summary" 
              woodStyle
              right={(
                <Button
                  variant="campus"
                  size="sm"
                  rightIcon={<MaterialCommunityIcons name="chevron-right" size={18} color="#ffffff" />}
                  onPress={() => navigation?.navigate?.('Profile')}
                >
                  Edit
                </Button>
              )}
            />
            <Card.Content>
              <View style={styles.profileSummary}>
                <Avatar 
                  uri={profile?.avatar_url}
                  initials={profile?.first_name?.[0] || '?'}
                  size="lg"
                  woodFrame
                  backgroundColor={colors.campus.blue}
                />
                <View style={styles.profileInfo}>
                  <Text variant="titleMedium" style={styles.profileName}>
                    {profile?.first_name} {profile?.last_name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.universityText}>
                    {getUniversityDisplay()}
                  </Text>
                  
                  {/* Profile completion indicator */}
                  <View style={styles.completionContainer}>
                    <Text variant="bodySmall" style={styles.completionText}>
                      Profile completion: {profileCompletion}%
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${profileCompletion}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card variant="wood" style={styles.card}>
            <Card.Header 
              title="Latest Matches" 
              woodStyle
              right={(
                <Button
                  variant="campus"
                  size="sm"
                  rightIcon={<MaterialCommunityIcons name="chevron-right" size={18} color="#ffffff" />}
                  onPress={() => navigation?.navigate?.('Matches')}
                >
                  See All
                </Button>
              )}
            />
            <Card.Content>
              {matchesLoading ? (
                renderLoading('matches')
              ) : matches.length === 0 ? (
                renderEmpty('No matches yet! Start exploring to find connections', 'account-search')
              ) : (
                matches.slice(0, 3).map(match => (
                  <MatchCard key={match.id} profile={match.otherUser} onMessage={() => {}} />
                ))
              )}
            </Card.Content>
          </Card>

          <Card variant="wood" style={styles.card}>
            <Card.Header 
              title="Upcoming Meetups" 
              woodStyle
              right={(
                <Button
                  variant="campus"
                  size="sm"
                  rightIcon={<MaterialCommunityIcons name="chevron-right" size={18} color="#ffffff" />}
                  onPress={() => navigation?.navigate?.('Meetups')}
                >
                  See All
                </Button>
              )}
            />
            <Card.Content>
              {meetupsLoading ? (
                renderLoading('meetups')
              ) : meetups.filter(m => m.status === 'confirmed').length === 0 ? (
                renderEmpty('No upcoming meetups. Schedule one with your connections!', 'calendar-blank')
              ) : (
                meetups.filter(m => m.status === 'confirmed').slice(0, 2).map(meetup => (
                  <MeetupCard key={meetup.id} meetup={meetup} />
                ))
              )}
            </Card.Content>
          </Card>

          <Card variant="wood" style={styles.card}>
            <Card.Header 
              title="Recent Messages" 
              woodStyle
              right={(
                <Button
                  variant="campus"
                  size="sm"
                  rightIcon={<MaterialCommunityIcons name="chevron-right" size={18} color="#ffffff" />}
                  onPress={() => navigation?.navigate?.('Messages')}
                >
                  Open
                </Button>
              )}
            />
            <Card.Content>
              {convLoading ? (
                renderLoading('messages')
              ) : conversations.length === 0 ? (
                renderEmpty('No recent messages. Start a conversation!', 'message-text')
              ) : (
                conversations.slice(0, 3).map(conv => (
                  <MessageCard key={conv.id} conversation={conv} onOpen={() => navigation.navigate('DirectChat', { id: conv.id })} />
                ))
              )}
            </Card.Content>
          </Card>

          <Card variant="wood" style={styles.card}>
            <Card.Header 
              title="Notifications" 
              woodStyle
              right={(
                <Button
                  variant="campus"
                  size="sm"
                  rightIcon={<MaterialCommunityIcons name="chevron-right" size={18} color="#ffffff" />}
                  onPress={() => navigation?.navigate?.('Notifications')}
                >
                  View All
                </Button>
              )}
            />
            <Card.Content>
              {notifLoading ? (
                renderLoading('notifications')
              ) : notifications.length === 0 ? (
                renderEmpty("No notifications. You're all caught up!", 'bell')
              ) : (
                notifications.slice(0, 3).map(notif => (
                  <NotificationCard key={notif.id} notification={notif} />
                ))
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.wood.dark,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  woodGrainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
    // Linear pattern that mimics wood grain
    backgroundImage: Platform.OS === 'web' 
      ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 2px, transparent 2px, transparent 8px)' 
      : undefined,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.4,
    left: -width * 0.3,
    transform: [{ rotate: '-15deg' }],
  },
  circle2: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.3,
    right: -width * 0.3,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  headerTextContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  title: {
    fontWeight: 'bold',
    color: colors.onPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: colors.wood.lightest,
    marginTop: spacing[1],
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: { 
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  card: {
    marginBottom: spacing[4],
    ...createShadow(4),
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing[4],
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    color: colors.wood.darkest,
  },
  universityText: {
    color: colors.wood.dark,
    marginTop: spacing[1],
  },
  completionContainer: {
    marginTop: spacing[2],
  },
  completionText: {
    color: colors.muted,
    marginBottom: spacing[1],
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.campus.blue,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[6],
    flexDirection: 'row',
  },
  loadingText: {
    color: colors.muted,
    marginLeft: spacing[2],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[6],
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing[2],
  },
});

export default DashboardScreen; 
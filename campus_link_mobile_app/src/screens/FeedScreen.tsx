import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useMatching } from '../contexts/MatchingContext';
import { Card, Button, Avatar, colors, createShadow, spacing, radius } from '../components/ui';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import AppIcon from '../components/ui/icons/AppIcon';

const { width } = Dimensions.get('window');

const FeedScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const {
    matches,
    loading,
    fetchMatches,
    acceptMatch,
    rejectMatch,
  } = useMatching();
  
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleAccept = async (matchId: string) => {
    try {
      setActionLoading('accept');
      await acceptMatch(matchId);
      setCurrentMatchIndex(prev => Math.min(prev + 1, (matches?.length || 0) - 1));
    } catch (err) {
      console.error('Error accepting match:', err);
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      setActionLoading('reject');
      await rejectMatch(matchId);
      setCurrentMatchIndex(prev => Math.min(prev + 1, (matches?.length || 0) - 1));
    } catch (err) {
      console.error('Error rejecting match:', err);
    } finally {
      setActionLoading('');
    }
  };

  const navigateMatches = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentMatchIndex < matches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    } else if (direction === 'prev' && currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.campus.blue} />
        <Text style={styles.loadingText}>Finding potential matches...</Text>
        <Text style={styles.loadingSubtext}>This might take a moment</Text>
      </View>
    );
  }

  if (!matches?.length) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <MaterialCommunityIcons name="heart" size={48} color={colors.muted} />
        </View>
        <Text style={styles.emptyTitle}>No matches found</Text>
        <Text style={styles.emptyText}>
          We're still looking for great matches for you. Check back later or update your profile to improve your matching chances.
        </Text>
        <Button
          onPress={() => fetchMatches()}
          variant="campus"
          style={styles.refreshButton}
        >
          Refresh Matches
        </Button>
      </View>
    );
  }

  const currentMatch = matches[currentMatchIndex];

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
          <AppIcon size={40} variant="full" />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Discover Students
            </Text>
          </View>
        </View>

        <Text style={styles.counterText}>
          Showing {currentMatchIndex + 1} of {matches.length} potential connections
        </Text>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.cardContainer}>
            <Animated.View 
              key={currentMatch.id}
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(300)}
              style={styles.matchCardWrapper}
            >
              <Card variant="wood" style={styles.matchCard}>
                <Card.Content style={styles.cardContent}>
                  {/* Profile photo */}
                  <View style={styles.avatarContainer}>
                    <Avatar
                      uri={currentMatch.otherUser.avatar_url}
                      initials={`${currentMatch.otherUser.first_name?.[0] || '?'}${currentMatch.otherUser.last_name?.[0] || ''}`}
                      size="xl"
                      woodFrame
                      backgroundColor={colors.campus.blue}
                    />
                    {currentMatch.otherUser.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <MaterialCommunityIcons name="check-circle" size={22} color={colors.campus.blue} />
                      </View>
                    )}
                  </View>

                  {/* User info */}
                  <View style={styles.userInfo}>
                    <Text variant="headlineSmall" style={styles.userName}>
                      {currentMatch.otherUser.first_name} {currentMatch.otherUser.last_name}
                    </Text>
                    
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="school" size={18} color={colors.wood.dark} />
                      <Text style={styles.infoText}>
                        {currentMatch.otherUser.university_id || 'University not specified'}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="book-open-variant" size={18} color={colors.wood.dark} />
                      <Text style={styles.infoText}>
                        {currentMatch.otherUser.major_id || 'Major not specified'}
                      </Text>
                    </View>
                  </View>

                  {/* Bio */}
                  {currentMatch.otherUser.bio && (
                    <View style={styles.bioContainer}>
                      <Text variant="titleMedium" style={styles.bioTitle}>About</Text>
                      <Text style={styles.bioText}>{currentMatch.otherUser.bio}</Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={styles.actionButtonsContainer}>
                    <Button
                      variant="outline"
                      size="default"
                      onPress={() => handleReject(currentMatch.otherUser.id)}
                      style={styles.rejectButton}
                      disabled={actionLoading !== ''}
                      leftIcon={<MaterialCommunityIcons name="close" size={24} color={colors.error} />}
                    >
                      {actionLoading === 'reject' ? 'Skipping...' : 'Skip'}
                    </Button>
                    
                    <Button
                      variant="campus"
                      size="default"
                      onPress={() => handleAccept(currentMatch.otherUser.id)}
                      style={styles.acceptButton}
                      disabled={actionLoading !== ''}
                      leftIcon={<MaterialCommunityIcons name="heart" size={24} color="#ffffff" />}
                    >
                      {actionLoading === 'accept' ? 'Connecting...' : 'Connect'}
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>
          </View>

          {/* Navigation buttons */}
          <View style={styles.navigationButtonsContainer}>
            <Button
              variant="outline"
              size="default"
              disabled={currentMatchIndex === 0}
              onPress={() => navigateMatches('prev')}
              style={styles.navButton}
              leftIcon={<MaterialCommunityIcons name="chevron-left" size={24} color={colors.wood.dark} />}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="default"
              disabled={currentMatchIndex === matches.length - 1}
              onPress={() => navigateMatches('next')}
              style={styles.navButton}
              rightIcon={<MaterialCommunityIcons name="chevron-right" size={24} color={colors.wood.dark} />}
            >
              Next
            </Button>
          </View>
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
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  woodGrainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  counterText: {
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[4],
    color: colors.wood.lightest,
  },
  contentContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  cardContainer: {
    alignItems: 'center',
    minHeight: 500,
  },
  matchCardWrapper: {
    width: '100%',
  },
  matchCard: {
    ...createShadow(4),
  },
  cardContent: {
    padding: spacing[4],
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 2,
    ...createShadow(2),
  },
  userInfo: {
    marginBottom: spacing[4],
  },
  userName: {
    fontWeight: 'bold',
    color: colors.wood.darkest,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  infoText: {
    marginLeft: spacing[2],
    color: colors.wood.dark,
    flex: 1,
  },
  bioContainer: {
    marginBottom: spacing[4],
  },
  bioTitle: {
    fontWeight: 'bold',
    color: colors.wood.darkest,
    marginBottom: spacing[1],
  },
  bioText: {
    color: colors.wood.darkest,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  rejectButton: {
    flex: 1,
    marginRight: spacing[2],
  },
  acceptButton: {
    flex: 1,
    marginLeft: spacing[2],
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[4],
  },
  navButton: {
    flex: 1,
    marginHorizontal: spacing[2],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.wood.lightest,
    marginTop: spacing[4],
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.wood.light,
    marginTop: spacing[2],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.wood.lightest,
    marginBottom: spacing[2],
  },
  emptyText: {
    textAlign: 'center',
    color: colors.wood.light,
    marginBottom: spacing[4],
  },
  refreshButton: {
    minWidth: 200,
  },
});

export default FeedScreen;
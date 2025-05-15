import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConversations } from '../contexts/ConversationContext';
import { useNavigation } from '@react-navigation/native';
import { Avatar, Card, colors, createShadow, spacing, radius } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isToday, isYesterday } from 'date-fns';
import AppIcon from '../components/ui/icons/AppIcon';

const { width } = Dimensions.get('window');

const ChatScreen = () => {
  const { conversations, loading } = useConversations();
  const [searchTerm, setSearchTerm] = useState('');
  const navigation = useNavigation();

  // Filter conversations based on search term
  const filteredConversations = searchTerm
    ? conversations.filter(conv => 
        (conv.other_user?.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (conv.other_user?.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : conversations;

  // Format date for last message
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'p'); // e.g. 12:00 PM
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d'); // e.g. Jan 1
    }
  };

  const handleConversationPress = (conversation: any) => {
    navigation.navigate('DirectChat' as never, { 
      id: conversation.id,
      name: `${conversation.other_user?.first_name || ''} ${conversation.other_user?.last_name || ''}`.trim() 
    } as never);
  };

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
          <AppIcon size={40} />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Messages
            </Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.wood.dark} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations"
            placeholderTextColor={colors.wood.dark}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="loading" size={40} color={colors.campus.blue} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="message-text" size={60} color={colors.wood.light} />
            <Text style={styles.emptyTitle}>
              {searchTerm 
                ? `No conversations found matching "${searchTerm}"`
                : "You don't have any messages yet."
              }
            </Text>
            {!searchTerm && (
              <Text style={styles.emptySubtitle}>
                Start conversations with your matches to see them here.
              </Text>
            )}
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.conversationsList}
          >
            {filteredConversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                onPress={() => handleConversationPress(conversation)}
                activeOpacity={0.7}
              >
                <Card variant="wood" style={styles.conversationCard}>
                  <Card.Content style={styles.conversationCardContent}>
                    <View style={styles.conversationInfo}>
                      <Avatar
                        uri={conversation.other_user?.avatar_url}
                        initials={`${conversation.other_user?.first_name?.[0] || ''}${conversation.other_user?.last_name?.[0] || ''}`}
                        size="md"
                        woodFrame
                      />
                      <View style={styles.messageDetails}>
                        <View style={styles.nameTimeRow}>
                          <Text numberOfLines={1} style={styles.userName}>
                            {conversation.other_user?.first_name} {conversation.other_user?.last_name}
                          </Text>
                          {conversation.last_message && (
                            <Text style={styles.timeText}>
                              {formatMessageDate(conversation.last_message.created_at)}
                            </Text>
                          )}
                        </View>
                        <Text numberOfLines={1} style={styles.messagePreview}>
                          {conversation.last_message?.content || 'No messages yet'}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={20} 
                      color={colors.wood.dark} 
                    />
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.wood.lightest,
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
    borderRadius: radius.md,
    ...createShadow(2),
  },
  searchIcon: {
    paddingHorizontal: spacing[3],
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: colors.wood.darkest,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  conversationsList: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  conversationCard: {
    marginBottom: spacing[3],
    ...createShadow(2),
  },
  conversationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageDetails: {
    flex: 1,
    marginLeft: spacing[3],
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  userName: {
    fontWeight: 'bold',
    flex: 1,
    color: colors.wood.darkest,
  },
  timeText: {
    fontSize: 12,
    color: colors.wood.dark,
  },
  messagePreview: {
    color: colors.wood.dark,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    color: colors.wood.lightest,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    marginTop: spacing[4],
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.wood.lightest,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: spacing[2],
    color: colors.wood.light,
    textAlign: 'center',
  },
});

export default ChatScreen; 
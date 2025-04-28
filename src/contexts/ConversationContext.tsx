import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageType, ConversationType } from '@/types/database';
import { useAuth } from './AuthContext';
import { fetchMessagesWithProfiles } from '@/utils/dataHelpers';
import { requestManager } from '@/utils/requestManager';
import { simpleCache } from '@/utils/simpleCache';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { isMatchId, extractUserIdsFromMatchId, createMatchId } from '@/utils/matchHelpers';
import { notifyNewMessage } from '@/utils/notifications';

// Add a utility function to correct match IDs
const correctMatchId = (providedId: string): string => {
  // If the provided ID is the problematic one, replace it
  if (providedId === '6a18899d-8211-4fdd-ac7a-dbf2a28c74f0') {
    console.warn('Replacing incorrect match ID with correct one');
    return '2dda14eb-d893-4929-90d3-5bacfebd073d';
  }
  
  // Add more problematic IDs to the correction list
  const problematicIds: Record<string, string> = {
    'f2ac5dbe-ba5e-4017-88e4-830ada2bc484': '2dda14eb-d893-4929-90d3-5bacfebd073d',
    'cffaf258-bf5e-48c8-a5c5-e31c1d56cc57': '2dda14eb-d893-4929-90d3-5bacfebd073d'
  };
  
  if (problematicIds[providedId]) {
    console.warn(`Replacing problematic match ID ${providedId} with correct one`);
    return problematicIds[providedId];
  }
  
  return providedId;
};

// Add a function to clean up duplicate conversations
const cleanupDuplicateConversations = async () => {
  try {
    console.log('Cleaning up duplicate conversations...');
    
    // Get all matches
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('id');
      
    if (matchError) throw matchError;
    
    if (!matches || !Array.isArray(matches)) {
      console.log('No matches found or invalid data format');
      return;
    }
    
    for (const match of matches) {
      // Get all conversations for this match
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, match_id, created_at')
        .eq('match_id', match.id)
        .order('created_at', { ascending: true });
        
      if (convError) throw convError;
      
      if (conversations && Array.isArray(conversations) && conversations.length > 1) {
        console.log(`Found ${conversations.length} conversations for match ${match.id}`);
        
        // Keep the oldest conversation
        const [keepConversation, ...duplicateConversations] = conversations;
        const duplicateIds = duplicateConversations.map(c => c.id);
        
        console.log(`Keeping conversation ${keepConversation.id}, removing ${duplicateIds.length} duplicates`);
        
        // Get all messages from duplicate conversations
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', duplicateIds);
          
        if (msgError) throw msgError;
        
        if (messages && Array.isArray(messages) && messages.length > 0) {
          console.log(`Moving ${messages.length} messages to conversation ${keepConversation.id}`);
          
          // Update messages to use the kept conversation
          for (const message of messages) {
            await supabase
              .from('messages')
              .update({ conversation_id: keepConversation.id })
              .eq('id', message.id);
          }
        }
        
        // Delete duplicate conversations
        const { error: deleteError } = await supabase
          .from('conversations')
          .delete()
          .in('id', duplicateIds);
          
        if (deleteError) throw deleteError;
        
        console.log(`Deleted ${duplicateIds.length} duplicate conversations`);
      }
    }
    
    console.log('Cleanup complete');
  } catch (error) {
    console.error('Error cleaning up duplicate conversations:', error);
  }
};

// Add a debugging function to check the conversations table structure
const checkConversationsSchema = async () => {
  try {
    console.log('Checking conversations table schema...');
    
    // Query the database schema information
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error checking conversations schema:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Conversations table columns:', Object.keys(data[0]));
    } else {
      console.log('No conversations found to check schema');
    }
  } catch (err) {
    console.error('Error in schema check:', err);
  }
};

interface ConversationContextType {
  conversations: ConversationType[];
  messages: MessageType[];
  loading: boolean;
  error: string | null;
  fetchConversations: (force?: boolean) => Promise<ConversationType[]>;
  refreshConversations: () => Promise<void>;
  getConversationsWithProfiles: () => Promise<ConversationType[]>;
  sendMessage: (conversationId: string, content: string) => Promise<MessageType>;
  fetchMessages: (conversationId: string) => Promise<MessageType[]>;
  fetchMessagesByMatchId: (matchId: string) => Promise<MessageType[]>;
  checkForMessages: (matchId: string) => Promise<MessageType[]>;
  setCurrentConversation: (conversation: ConversationType | null) => void;
  getOrCreateConversation: (matchId: string) => Promise<ConversationType>;
}

const ConversationContext = createContext<ConversationContextType>({
  conversations: [],
  messages: [],
  loading: false,
  error: null,
  fetchConversations: async () => [],
  refreshConversations: async () => {},
  getConversationsWithProfiles: async () => [],
  sendMessage: async () => ({ id: '', content: '', created_at: '', conversation_id: '', sender_id: '', is_read: false, sender: { first_name: '', last_name: '', avatar_url: '' } }),
  fetchMessages: async () => [],
  fetchMessagesByMatchId: async () => [],
  checkForMessages: async () => [],
  setCurrentConversation: () => {},
  getOrCreateConversation: async () => ({ id: '', match_id: '', created_at: '', updated_at: '', otherUser: { id: '', first_name: '', last_name: '', avatar_url: '' }, last_message: null })
});

// Add a cache for conversations by match ID
const conversationCache = new Map();

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const isLoading = isLoadingConversations || isLoadingMessages;
  const [matches, setMatches] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationType | null>(null);
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add refs for tracking fetch state
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update fetchConversations to filter out invalid conversations
  const fetchConversations = useCallback(async (force = false) => {
    if (!user) return [];
    
    // Skip if already fetching unless forced
    if (isFetchingRef.current && !force) {
      console.log('Fetch already in progress, skipping...');
      return conversations;
    }
    
    // Skip if in cooldown unless forced
    const now = Date.now();
    if (!force && lastFetchTimeRef.current && now - lastFetchTimeRef.current < 10000) { // 10 second cooldown
      console.log('Fetch cooldown active, skipping...');
      return conversations;
    }
    
    isFetchingRef.current = true;
    setIsLoadingConversations(true);
    
    try {
      // Check cache first
      const cacheKey = `conversations-${user.id}`;
      const cachedData = simpleCache.get<ConversationType[]>(cacheKey);
      
      if (cachedData && !force) {
        console.log('Using cached conversations data');
        setConversations(cachedData);
        return cachedData;
      }
      
      console.log('Fetching conversations for user:', user.id);
      
      // First, get the matches where this user is involved
      const { data: userMatches, error: matchError } = await supabase
          .from('matches')
        .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchError) {
        console.error('Error fetching user matches:', matchError);
        throw matchError;
      }
      
      if (!userMatches || userMatches.length === 0) {
        console.log('No matches found for user');
        setConversations([]);
        return [];
      }
      
      const matchIds = userMatches.map(m => m.id);
      console.log('Found matches for user:', matchIds);
      
      // Now get conversations for these matches
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('*, match:match_id(*)')
        .in('match_id', matchIds)
        .order('updated_at', { ascending: false });

      if (convError) {
        console.error('Error fetching conversations:', convError);
        throw convError;
      }
      
      if (!conversationsData || conversationsData.length === 0) {
        console.log('No conversations found for matches');
        setConversations([]);
        return [];
      }

      // Filter out conversations with invalid matches
      const validConversations = conversationsData.filter(conv => {
        if (!conv.match) {
          console.warn('Conversation has invalid match:', conv.id, conv.match_id);
          return false;
        }
        return true;
      });
      
      console.log('Valid conversations:', validConversations.length, 'of', conversationsData.length);

      // Create a map to track the oldest conversation for each match
      const matchConversationMap = new Map();
      
      // Process conversations to keep only the oldest one for each match
      validConversations.forEach(conv => {
        const matchId = conv.match_id;
        if (!matchConversationMap.has(matchId) || 
            new Date(conv.created_at) < new Date(matchConversationMap.get(matchId).created_at)) {
          matchConversationMap.set(matchId, conv);
        }
      });
      
      // Convert map to array
      const uniqueConversations = Array.from(matchConversationMap.values());
      console.log('Unique conversations:', uniqueConversations.length, 'of', validConversations.length);

      // Fetch last messages for each conversation with throttling
      const lastMessages = [];
      for (let i = 0; i < uniqueConversations.length; i++) {
        const conversation = uniqueConversations[i];
        
        // Add a small delay between requests
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        try {
          const { data: lastMessageData, error: lastMessageError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (lastMessageError) {
            console.error('Error fetching last message:', lastMessageError);
            lastMessages.push(null);
            continue;
          }

          lastMessages.push(lastMessageData && lastMessageData.length > 0 ? lastMessageData[0] : null);
        } catch (error) {
          console.error('Error in last message fetch:', error);
          lastMessages.push(null);
        }
      }

      // Map the conversations to include otherUser info
      const conversationsWithUsers = uniqueConversations.map((conv: any, index: number) => {
        const match = conv.match;
        if (!match) return null;

        const isUser1 = match.user1_id === user?.id;
        const otherUserId = isUser1 ? match.user2_id : match.user1_id;
        const otherUserProfile = isUser1 
          ? (match.profiles_user2 || {}) 
          : (match.profiles_user1 || {});

        const lastMessage = lastMessages[index];

        return {
          id: conv.id,
          match_id: conv.match_id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          otherUser: {
            id: otherUserId,
            first_name: otherUserProfile.first_name || '',
            last_name: otherUserProfile.last_name || '',
            avatar_url: otherUserProfile.avatar_url || '',
          },
          last_message: lastMessage as MessageType | undefined
        };
      }).filter(Boolean) as ConversationType[];

      // Cache the results for 30 seconds
      simpleCache.set(cacheKey, conversationsWithUsers, 30000);

      setConversations(conversationsWithUsers);
      lastFetchTimeRef.current = Date.now();
      return conversationsWithUsers;
    } catch (error: any) {
      if (error.message === 'Request in cooldown') {
        // This is expected, not a real error
        return conversations;
      }
      console.error('Error fetching conversations:', error.message);
      return conversations;
    } finally {
      setIsLoadingConversations(false);
      isFetchingRef.current = false;
    }
  }, [user, conversations]);

  // Update the cleanup function to not use user1_id and user2_id
  const cleanupInvalidConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Checking for invalid conversations...');
      
      // Get all conversations
      const { data: allConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id, match_id');
        
      if (fetchError) throw fetchError;
      if (!allConversations || allConversations.length === 0) return;
      
      // Get all match IDs
      const matchIds = allConversations
        .map(c => c.match_id)
        .filter(Boolean) as string[];
      
      if (matchIds.length === 0) return;
      
      // Check which matches exist
      const { data: existingMatches, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .in('id', matchIds);
        
      if (matchError) throw matchError;
      
      // Create a set of valid match IDs for quick lookup
      const validMatchIds = new Set(existingMatches?.map(m => m.id) || []);
      
      // Find conversations with invalid match IDs
      const invalidConversations = allConversations.filter(
        conv => conv.match_id && !validMatchIds.has(conv.match_id)
      );
      
      if (invalidConversations.length === 0) {
        console.log('No invalid conversations found');
        return;
      }
      
      console.log('Found invalid conversations:', invalidConversations);
      
      // Delete invalid conversations
      const invalidIds = invalidConversations.map(c => c.id);
      const { error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .in('id', invalidIds);
        
      if (deleteError) throw deleteError;
      
      console.log('Deleted invalid conversations:', invalidIds);
      
      // Refresh conversations after cleanup
      fetchConversations(true);
    } catch (error) {
      console.error('Error cleaning up conversations:', error);
    }
  }, [user, fetchConversations]);

  // Call cleanup function on mount
  useEffect(() => {
    if (user) {
      cleanupInvalidConversations();
      // Check the conversations schema
      checkConversationsSchema();
      // Clean up duplicate conversations
      cleanupDuplicateConversations();
    }
  }, [user, cleanupInvalidConversations]);

  useEffect(() => {
    const fetchAllMatches = async () => {
      if (!user) return;

      try {
        // 1. First get the matches - use a simple query without joins
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
          return;
        }

        if (!matchesData || matchesData.length === 0) {
          setMatches([]);
          return;
        }

        // 2. Get all the user IDs that we need profiles for
        const otherUserIds = matchesData.map(match => 
          match.user1_id === user.id ? match.user2_id : match.user1_id
        );

        // 3. Fetch those profiles - ONLY select columns that exist in your schema
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', otherUserIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // 4. Create a map for easy lookup
        const profileMap = profilesData?.reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {} as Record<string, any>) || {};

        // 5. Combine the data
        const matchesWithProfiles = matchesData.map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const otherUserProfile = profileMap[otherUserId] || {
            id: otherUserId,
            first_name: 'Unknown',
            last_name: 'User',
            avatar_url: null
          };

          return {
            ...match,
            profiles_user1: match.user1_id === user.id ? null : profileMap[match.user1_id],
            profiles_user2: match.user2_id === user.id ? null : profileMap[match.user2_id]
          };
        });

        setMatches(matchesWithProfiles || []);
      } catch (error: any) {
        console.error('Error fetching matches:', error.message);
      }
    };

    fetchAllMatches();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, matches]);

  const fetchMessages = useCallback(async (conversationId: string): Promise<MessageType[]> => {
    if (isLoadingMessages) {
      console.log('Messages fetch already in progress, skipping...');
      return messages;
    }

    setIsLoadingMessages(true);
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return messages as unknown as MessageType[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user, messages, isLoadingMessages]);

  // Define getOrCreateConversation before it's used in fetchMessagesByMatchId
  const getOrCreateConversation = async (matchId: string): Promise<ConversationType> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check cache first
      const cachedConversation = simpleCache.get<ConversationType>(`conversation-${matchId}`);
      if (cachedConversation) return cachedConversation;

      // Verify the match exists first
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
        
      if (matchError) {
        console.error('Error verifying match:', matchError);
        throw new Error('Match not found');
      }
      
      if (!match) {
        throw new Error('Match not found');
      }

      // Check if conversation exists - get all conversations for this match
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // If conversations exist, return the oldest one
      if (existingConversations && existingConversations.length > 0) {
        const oldestConversation = existingConversations[0];
        console.log('Found existing conversation:', oldestConversation);
        
        // If there are duplicates, log a warning
        if (existingConversations.length > 1) {
          console.warn(`Found ${existingConversations.length} conversations for match ${matchId}, using oldest`);
        }
        
        simpleCache.set(`conversation-${matchId}`, oldestConversation);
        return oldestConversation;
      }

      // Create new conversation
      console.log('No conversation found, creating new one for match:', matchId);
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert([
          { 
            match_id: matchId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (createError) throw createError;
      if (!newConversation) throw new Error('Failed to create conversation');

      simpleCache.set(`conversation-${matchId}`, newConversation);
      return newConversation;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      throw error;
    }
  };

  // Add a function to fetch messages by match ID
  const fetchMessagesByMatchId = useCallback(async (matchId: string): Promise<MessageType[]> => {
    try {
      console.log('Fetching messages for match:', matchId);
      
      if (!matchId || !user) {
        console.error('Missing matchId or user for fetching messages');
        return [];
      }
      
      // First get the conversation for this match
      console.log('Getting conversation for match ID:', matchId);
      
      // Use getOrCreateConversation to ensure we're using the correct conversation
      const conversation = await getOrCreateConversation(matchId);
      console.log('Using conversation:', conversation);
      
      // Now fetch messages for this conversation
      console.log('Fetching messages for conversation ID:', conversation.id);
      
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
        
      if (msgError) {
        console.error('Error fetching messages:', msgError);
        throw msgError;
      }
      
      console.log('Fetched messages:', messages ? messages.length : 0);
      setMessages(messages || []);
      return messages || [];
    } catch (error) {
      console.error('Error in fetchMessagesByMatchId:', error);
      setMessages([]);
      return [];
    }
  }, [user, getOrCreateConversation]);

  // Add a debugging function to check for messages
  const checkForMessages = useCallback(async (matchId: string): Promise<MessageType[]> => {
    try {
      console.log('Checking for messages for match:', matchId);
      
      // First get the conversation
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('match_id', matchId);
        
      if (convError) {
        console.error('Error checking conversations:', convError);
        return [];
      }
      
      if (!conversations || conversations.length === 0) {
        console.log('No conversations found for match');
        return [];
      }
      
      console.log('Found conversations:', conversations);
      
      // Check for messages in each conversation
      const messages = [];
      for (const conv of conversations) {
        const { data: convMessages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id);
          
        if (msgError) {
          console.error('Error checking messages:', msgError);
          continue;
        }
        
        const messageCount = convMessages && Array.isArray(convMessages) ? convMessages.length : 0;
        console.log(`Found ${messageCount} messages for conversation ${conv.id}`);
        
        if (convMessages && Array.isArray(convMessages) && convMessages.length > 0) {
          console.log('Sample message:', convMessages[0]);
          messages.push(...convMessages);
        }
      }
      
      return messages;
    } catch (error) {
      console.error('Error in checkForMessages:', error);
      return [];
    }
  }, []);

  const sendMessage = async (content: string, conversationId: string): Promise<MessageType> => {
    if (!user || !isOnline) {
      throw new Error('Cannot send message: User is offline or not authenticated');
    }

    setIsLoadingMessages(true);
    try {
      // First get the conversation to find the recipient
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*, matches!inner(*)')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;
      if (!conversation) throw new Error('Conversation not found');

      // Determine the recipient ID from the match
      const recipientId = conversation.matches.user1_id === user.id 
        ? conversation.matches.user2_id 
        : conversation.matches.user1_id;

      // Get recipient's profile
      const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', recipientId)
        .single();

      if (profileError) throw profileError;
      if (!recipientProfile) throw new Error('Recipient profile not found');

      // Send the message
      const { data: message, error } = await supabase
        .from('messages')
        .insert([
          {
            content,
        conversation_id: conversationId,
        sender_id: user.id,
        is_read: false,
            created_at: new Date().toISOString()
          }
        ])
        .select(`
          *,
          sender:profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
      console.error('Error sending message:', error);
        throw error;
      }

      // Create notification for the recipient
      await notifyNewMessage(
        recipientId,
        user.id,
        `${user.user_metadata.first_name} ${user.user_metadata.last_name}`,
        content,
        user.user_metadata.avatar_url
      );

      return message as unknown as MessageType;
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Add a function to get conversations with profiles
  const getConversationsWithProfiles = useCallback(async () => {
    try {
      if (!user) return [];
      
      // First get the conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*, match:match_id(*)')
        .order('updated_at', { ascending: false });
        
      if (convError) {
        console.error('Error fetching conversations:', convError);
        throw convError;
      }
      
      if (!conversations || conversations.length === 0) return [];
      
      // Extract all user IDs from the matches
      const userIds = new Set<string>();
      conversations.forEach(conv => {
        if (conv.match) {
          userIds.add(conv.match.user1_id);
          userIds.add(conv.match.user2_id);
        }
      });
      
      // Fetch profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', Array.from(userIds));
        
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        throw profileError;
      }
      
      // Create a map for quick profile lookup
      const profileMap: Record<string, any> = {};
      if (profiles) {
        profiles.forEach(profile => {
          profileMap[profile.id] = profile;
        });
      }
      
      // Enhance conversations with profile data
      return conversations.map(conv => {
        if (!conv.match) return conv;
        
        const user1Profile = profileMap[conv.match.user1_id];
        const user2Profile = profileMap[conv.match.user2_id];
        
        return {
          ...conv,
          user1Profile,
          user2Profile
        };
      });
    } catch (error) {
      console.error('Error getting conversations with profiles:', error);
      return [];
    }
  }, [user]);

  const refreshConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedConversations = await fetchConversations(true);
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      setError('Failed to refresh conversations');
    } finally {
      setLoading(false);
    }
  }, [user, fetchConversations]);

  const value: ConversationContextType = {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    refreshConversations,
    getConversationsWithProfiles,
    sendMessage,
    fetchMessages,
    fetchMessagesByMatchId,
    checkForMessages,
    setCurrentConversation,
    getOrCreateConversation
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

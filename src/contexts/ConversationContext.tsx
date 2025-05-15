import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageType, ConversationType, ProfileType } from '@/types/database';
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

// Add these type definitions at the top of the file
interface MessageWithSender extends Omit<MessageType, 'sender'> {
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    nickname: string | null;
    bio: string | null;
    nationality: string | null;
    year_of_study: number | null;
    major_id: string | null;
    student_type: string | null;
    interests: string[];
    languages: any[];
    cultural_insight: string | null;
    is_verified: boolean;
    location: string | null;
    created_at: string;
    updated_at: string;
    university: { id: string; name: string; } | null;
    campus: { id: string; name: string; } | null;
  } | null;
}

interface LoadingState {
  conversations: boolean;
  messages: boolean;
  sending: boolean;
}

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
  getConversation: (conversationId: string) => Promise<ConversationType | null>;
  loadMessages: (conversationId: string) => Promise<MessageType[]>;
  loadingState: LoadingState;
  optimisticMessages: MessageType[];
  markMessagesAsRead: (conversationId: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType>({
  conversations: [],
  messages: [],
  loading: false,
  error: null,
  fetchConversations: async () => [],
  refreshConversations: async () => {},
  getConversationsWithProfiles: async () => [],
  sendMessage: async () => ({
    id: '',
    content: '',
    created_at: '',
    conversation_id: '',
    sender_id: '',
    is_read: false,
    sender: {
      id: '',
      first_name: '',
      last_name: '',
      nickname: null,
      bio: null,
      nationality: null,
      year_of_study: null,
      university_id: null,
      campus_id: null,
      major_id: null,
      student_type: null,
      cultural_insight: null,
      location: null,
      avatar_url: '',
      avatar_signed_url: null,
      is_verified: false,
      created_at: '',
      updated_at: '',
      interests: [],
      languages: [],
      university: null,
      campus: null,
      major: null,
    },
  }),
  fetchMessages: async () => [],
  fetchMessagesByMatchId: async () => [],
  checkForMessages: async () => [],
  setCurrentConversation: () => {},
  getOrCreateConversation: async () => ({
    id: '',
    match_id: '',
    created_at: '',
    updated_at: '',
    other_user: {
      id: '',
      first_name: '',
      last_name: '',
      nickname: null,
      bio: null,
      nationality: null,
      year_of_study: null,
      university_id: null,
      campus_id: null,
      major_id: null,
      student_type: null,
      cultural_insight: null,
      location: null,
      avatar_url: '',
      avatar_signed_url: null,
      is_verified: false,
      created_at: '',
      updated_at: '',
      interests: [],
      languages: [],
      university: null,
      campus: null,
      major: null,
    },
    last_message: null
  }),
  getConversation: async () => null,
  loadMessages: async () => [],
  loadingState: {
    conversations: false,
    messages: false,
    sending: false
  },
  optimisticMessages: [],
  markMessagesAsRead: async () => {}
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
  const [loadingState, setLoadingState] = useState<LoadingState>({
    conversations: false,
    messages: false,
    sending: false
  });
  const [optimisticMessages, setOptimisticMessages] = useState<MessageType[]>([]);
  
  // Add refs for tracking fetch state
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update fetchConversations to filter out invalid conversations
  const fetchConversations = useCallback(async (force = false) => {
    if (!user) return [];
    
    if (isFetchingRef.current && !force) {
      console.log('Fetch already in progress, skipping...');
      return conversations;
    }
    
    const now = Date.now();
    if (!force && lastFetchTimeRef.current && now - lastFetchTimeRef.current < 10000) {
      console.log('Fetch cooldown active, skipping...');
      return conversations;
    }
    
    isFetchingRef.current = true;
    setIsLoadingConversations(true);
    setError(null);
    
    try {
      // First, get all matches for the current user
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (matchError) throw matchError;
      
      if (!matches || matches.length === 0) {
        setConversations([]);
        return [];
      }

      // Get all user IDs from matches
      const userIds = new Set<string>();
      matches.forEach(match => {
        if (match.user1_id === user.id) {
          userIds.add(match.user2_id);
        } else {
          userIds.add(match.user1_id);
        }
      });

      // Fetch profiles for all users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, nickname')
        .in('id', Array.from(userIds));

      if (profileError) throw profileError;

      // Create a map for quick profile lookup
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      // Get conversations for these matches
      const matchIds = matches.map(m => m.id);
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          messages(
            id,
            content,
            created_at,
            sender_id,
            is_read,
            conversation_id
          )
        `)
        .in('match_id', matchIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Process conversations and combine with match data
      const processedConversations = conversationsData?.map(conv => {
        const match = matches.find(m => m.id === conv.match_id);
        if (!match) return null;

        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherUserProfile = profileMap.get(otherUserId);

        if (!otherUserProfile) return null;

        const lastMessage = conv.messages?.[0];

        return {
          id: conv.id,
          match_id: conv.match_id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          other_user: {
            id: otherUserProfile.id,
            first_name: otherUserProfile.first_name || '',
            last_name: otherUserProfile.last_name || '',
            avatar_url: otherUserProfile.avatar_url || '',
            nickname: otherUserProfile.nickname || null
          },
          last_message: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            sender_id: lastMessage.sender_id,
            is_read: lastMessage.is_read,
            conversation_id: lastMessage.conversation_id
          } : undefined
        } as ConversationType;
      }).filter(Boolean) as ConversationType[];

      setConversations(processedConversations);
      return processedConversations;
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      setError(error.message);
      return [];
    } finally {
      setIsLoadingConversations(false);
      isFetchingRef.current = false;
      lastFetchTimeRef.current = Date.now();
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
        .insert({
          match_id: matchId,
          user1_id: user.id,
          user2_id: otherUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

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

  // Add subscription setup
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const newMessage = payload.new as MessageType;
        
        // Only update if the message is for the current conversation
        if (currentConversation && newMessage.conversation_id === currentConversation.id) {
          // Fetch the complete message with sender info
          const { data: messageWithSender } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(
                id,
                first_name,
                last_name,
                avatar_url,
                nickname,
                bio,
                nationality,
                year_of_study,
                major_id,
                student_type,
                interests,
                languages,
                cultural_insight,
                is_verified,
                location,
                created_at,
                updated_at,
                university:universities!inner(
                  id,
                  name
                ),
                campus:campuses!inner(
                  id,
                  name
                )
              )
            `)
            .eq('id', newMessage.id)
            .single();

          if (messageWithSender) {
            setMessages(prev => [...prev, messageWithSender as unknown as MessageType]);
            // Remove from optimistic messages if it exists
            setOptimisticMessages(prev => prev.filter(m => m.id !== newMessage.id));
          }
        }
      })
      .subscribe();

    // Subscribe to message read status updates
    const readStatusSubscription = supabase
      .channel('message_read_status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`
      }, (payload) => {
        const updatedMessage = payload.new as MessageType;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === updatedMessage.id 
              ? { ...msg, is_read: updatedMessage.is_read }
              : msg
          )
        );
      })
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      readStatusSubscription.unsubscribe();
    };
  }, [user, currentConversation]);

  // Update sendMessage to include optimistic updates
  const sendMessage = async (content: string, conversationId: string): Promise<MessageType> => {
    if (!user || !isOnline) {
      throw new Error('Cannot send message: User is offline or not authenticated');
    }

    setLoadingState(prev => ({ ...prev, sending: true }));

    // Create optimistic message
    const optimisticMessage: MessageType = {
      id: `temp-${Date.now()}`,
      content,
      conversation_id: conversationId,
      sender_id: user.id,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        first_name: user.user_metadata.first_name,
        last_name: user.user_metadata.last_name,
        avatar_url: user.user_metadata.avatar_url,
        // ... other required fields with default values
      } as unknown as ProfileType
    };

    // Add to optimistic messages
    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([{
          content,
          conversation_id: conversationId,
          sender_id: user.id,
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            nickname,
            bio,
            nationality,
            year_of_study,
            major_id,
            student_type,
            interests,
            languages,
            cultural_insight,
            is_verified,
            location,
            created_at,
            updated_at,
            university:universities!inner(
              id,
              name
            ),
            campus:campuses!inner(
              id,
              name
            )
          )
        `)
        .single();

      if (error) throw error;
      if (!message) throw new Error('Failed to send message');

      // Remove optimistic message
      setOptimisticMessages(prev => 
        prev.filter(m => m.id !== optimisticMessage.id)
      );

      return message as unknown as MessageType;
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed optimistic message
      setOptimisticMessages(prev => 
        prev.filter(m => m.id !== optimisticMessage.id)
      );
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, sending: false }));
    }
  };

  // Add function to mark messages as read
  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Update loadMessages to include loading state
  const loadMessages = useCallback(async (conversationId: string): Promise<MessageType[]> => {
    if (!user) return [];

    setLoadingState(prev => ({ ...prev, messages: true }));

    try {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            nickname,
            bio,
            nationality,
            year_of_study,
            major_id,
            student_type,
            interests,
            languages,
            cultural_insight,
            is_verified,
            location,
            created_at,
            updated_at,
            university:universities!inner(
              id,
              name
            ),
            campus:campuses!inner(
              id,
              name
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        return [];
      }

      if (!messages) return [];

      // Mark messages as read
      await markMessagesAsRead(conversationId);

      const typedMessages = messages as unknown as MessageWithSender[];
      
      return [...typedMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        is_read: msg.is_read,
        conversation_id: msg.conversation_id,
        sender: msg.sender ? {
          ...msg.sender,
          university_id: msg.sender.university?.id || null,
          campus_id: msg.sender.campus?.id || null,
          university: msg.sender.university || null,
          campus: msg.sender.campus || null
        } as unknown as ProfileType : null
      })), ...optimisticMessages.filter(m => m.conversation_id === conversationId)];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    } finally {
      setLoadingState(prev => ({ ...prev, messages: false }));
    }
  }, [user, optimisticMessages]);

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

  const getConversation = useCallback(async (conversationId: string): Promise<ConversationType | null> => {
    if (!user) return null;
    
    try {
      // First, get the conversation
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          match:matches!inner(
            id,
            user1_id,
            user2_id,
            status
          )
        `)
        .eq('id', conversationId);

      if (convError) throw convError;
      if (!conversations || conversations.length === 0) return null;

      // Use the first conversation if multiple exist
      const conversation = conversations[0];

      // Get the other user's profile
      const otherUserId = conversation.match.user1_id === user.id 
        ? conversation.match.user2_id 
        : conversation.match.user1_id;

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          nickname,
          bio,
          nationality,
          year_of_study,
          major_id,
          student_type,
          interests,
          languages,
          cultural_insight,
          is_verified,
          location,
          created_at,
          updated_at,
          university:universities!inner(
            id,
            name
          ),
          campus:campuses!inner(
            id,
            name
          )
        `)
        .eq('id', otherUserId);

      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) throw new Error('Profile not found');

      const otherUser = {
        ...profiles[0],
        university: profiles[0].university || null,
        campus: profiles[0].campus || null
      };

      // Get the last message
      const { data: lastMessage, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: conversation.id,
        match_id: conversation.match_id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        other_user: otherUser as unknown as ProfileType,
        last_message: lastMessage || null
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }, [user]);

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
    getOrCreateConversation,
    getConversation,
    loadMessages,
    loadingState,
    optimisticMessages,
    markMessagesAsRead
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

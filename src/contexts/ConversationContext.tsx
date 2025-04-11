import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/enhanced-client';
import { useAuth } from './AuthContext';
import { ConversationType, MessageType } from '@/types/database';

type ConversationContextType = {
  conversations: ConversationType[] | null;
  messages: MessageType[] | null;
  loadingConversations: boolean;
  loadingMessages: boolean;
  fetchConversations: () => Promise<ConversationType[] | null>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationType[] | null>(null);
  const [messages, setMessages] = useState<MessageType[] | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllMatches = async () => {
      if (!user) return;

      try {
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            *,
            profiles_user1:user1_id(
              id,
              first_name,
              last_name,
              avatar_url,
              university,
              student_type,
              major,
              bio
            ),
            profiles_user2:user2_id(
              id,
              first_name,
              last_name,
              avatar_url,
              university,
              student_type,
              major,
              bio
            )
          `)
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
          return;
        }

        setMatches(matchesData || []);
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

  const fetchConversations = async () => {
    if (!user) return null;

    setLoadingConversations(true);
    try {
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        return null;
      }

      // Fetch last messages for each conversation
      const lastMessages = await Promise.all(
        conversationsData.map(async (conversation) => {
          const { data: lastMessageData, error: lastMessageError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (lastMessageError) {
            console.error('Error fetching last message:', lastMessageError);
            return null;
          }

          return lastMessageData && lastMessageData.length > 0 ? lastMessageData[0] : null;
        })
      );

      // Map the conversations to include otherUser info
      const conversationsWithUsers = conversationsData.map((conv: any) => {
        const match = matches.find((m: any) => m.id === conv.match_id);
        if (!match) return null;

        const otherUserId = match.user1_id === user?.id ? match.user2_id : match.user1_id;
        const otherUserProfile = match.user1_id === user?.id 
          ? (match.profiles_user2 || {}) 
          : (match.profiles_user1 || {});

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
          last_message: lastMessages.find((msg: any) => msg.conversation_id === conv.id) || null
        };
      }).filter(Boolean);

      setConversations(conversationsWithUsers as ConversationType[]);
      return conversationsWithUsers as ConversationType[];
    } catch (error: any) {
      console.error('Error fetching conversations:', error.message);
      return null;
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map((message: any) => ({
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        is_read: message.is_read,
        created_at: message.created_at,
        sender: message.profiles ? {
          first_name: message.profiles.first_name || '',
          last_name: message.profiles.last_name || '',
          avatar_url: message.profiles.avatar_url || ''
        } : undefined
      }));

      setMessages(formattedMessages as MessageType[]);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          { conversation_id: conversationId, sender_id: user.id, content: content, is_read: false },
        ]);

      if (error) throw error;

      // Optimistically update the messages state
      const newMessage: MessageType = {
        id: Math.random().toString(), // Temporary ID
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: {
          first_name: user?.user_metadata?.first_name || '',
          last_name: user?.user_metadata?.last_name || '',
          avatar_url: user?.user_metadata?.avatar_url || '',
        },
      };

      setMessages((prevMessages) => (prevMessages ? [...prevMessages, newMessage] : [newMessage]));

      // Fetch updated messages
      await fetchMessages(conversationId);
      await fetchConversations();
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  };

  const value: ConversationContextType = {
    conversations,
    messages,
    loadingConversations,
    loadingMessages,
    fetchConversations,
    fetchMessages,
    sendMessage,
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

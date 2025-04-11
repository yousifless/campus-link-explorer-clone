
import React, { createContext, useContext, useState } from 'react';
import { supabase, db } from '@/integrations/supabase/enhanced-client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { MessageType, ConversationType } from '@/types/database';

type ConversationContextType = {
  conversations: ConversationType[];
  currentConversation: ConversationType | null;
  messages: MessageType[];
  loading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  setCurrentConversation: (conversation: ConversationType | null) => void;
  markAsRead: (conversationId: string) => Promise<void>;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Get all matches where the user is involved
      const { data: matchesData, error: matchesError } = await db.matches()
        .select(`
          id, 
          user1_id, 
          user2_id`)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (matchesError) throw matchesError;
      if (!matchesData) return;

      // Get conversations with match data
      const conversationsPromises = matchesData.map(async (match) => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

        // Get other user's profile
        const { data: profileData, error: profileError } = await db.profiles()
          .select('id, first_name, last_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        if (profileError) throw profileError;

        // Get conversation for this match
        const { data: conversationData, error: conversationError } = await db.conversations()
          .select('*')
          .eq('match_id', match.id)
          .single();
          
        if (conversationError) throw conversationError;

        // Get last message in conversation
        const { data: messagesData, error: messagesError } = await db.messages()
          .select('*')
          .eq('conversation_id', conversationData.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (messagesError) throw messagesError;

        return {
          id: conversationData.id,
          match_id: match.id,
          created_at: conversationData.created_at,
          updated_at: conversationData.updated_at,
          otherUser: profileData,
          last_message: messagesData[0] as MessageType | undefined
        };
      });

      const conversationsResults = await Promise.all(conversationsPromises);
      setConversations(conversationsResults.filter(Boolean) as ConversationType[]);

    } catch (error: any) {
      toast({
        title: "Error fetching conversations",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      if (!user) return;

      // Get messages
      const { data, error } = await db.messages()
        .select(`
          id, conversation_id, sender_id, content, is_read, created_at,
          profiles!messages_sender_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data) return;

      // Transform data to match MessageType
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        is_read: msg.is_read,
        created_at: msg.created_at,
        sender: msg.profiles
      })) as MessageType[];

      setMessages(formattedMessages);

      // Mark messages as read
      await markAsRead(conversationId);

    } catch (error: any) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");

      // Send message
      const { data, error } = await db.messages()
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Get sender profile data
      const { data: senderData, error: senderError } = await db.profiles()
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (senderError) throw senderError;

      // Create a message with sender data
      const newMessage: MessageType = {
        ...data,
        sender: senderData
      };

      // Update the messages state
      setMessages([...messages, newMessage]);

      // Update conversation's updated_at
      await db.conversations()
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Get the other user ID to send notification
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        // Create notification for the other user
        await db.notifications()
          .insert({
            user_id: conversation.otherUser.id,
            type: 'new_message',
            content: `New message from ${user.user_metadata.firstName || 'someone'}`,
            related_id: conversationId,
            is_read: false
          });
      }
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      if (!user) return;

      await db.messages()
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

    } catch (error: any) {
      console.error("Error marking messages as read:", error);
    }
  };

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    setCurrentConversation,
    markAsRead,
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

export type { MessageType, ConversationType };

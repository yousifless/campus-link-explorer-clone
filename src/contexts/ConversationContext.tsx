
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export type MessageType = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
};

export type ConversationType = {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
  otherUser: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  last_message?: MessageType;
};

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
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id, 
          user1_id, 
          user2_id,
          conversations(id, created_at, updated_at)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (matchesError) throw matchesError;

      // Get conversations with match data
      const conversationsPromises = matchesData.map(async (match) => {
        if (!match.conversations[0]) return null;

        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

        // Get other user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        if (profileError) throw profileError;

        // Get last message in conversation
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', match.conversations[0].id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (messagesError) throw messagesError;

        return {
          id: match.conversations[0].id,
          match_id: match.id,
          created_at: match.conversations[0].created_at,
          updated_at: match.conversations[0].updated_at,
          otherUser: profileData,
          last_message: messagesData[0] || undefined
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
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, conversation_id, sender_id, content, is_read, created_at,
          sender:profiles(first_name, last_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data);

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
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        })
        .select(`
          id, conversation_id, sender_id, content, is_read, created_at,
          sender:profiles(first_name, last_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update the messages state
      setMessages([...messages, data]);

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Get the other user ID to send notification
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        // Create notification for the other user
        await supabase
          .from('notifications')
          .insert({
            user_id: conversation.otherUser.id,
            type: 'new_message',
            content: `New message from ${user.user_metadata.firstName || 'someone'}`,
            related_id: conversationId
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

      await supabase
        .from('messages')
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

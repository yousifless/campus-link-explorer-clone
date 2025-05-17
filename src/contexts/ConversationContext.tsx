
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConversationType, Message } from './matching/types';
import { useAuth } from './AuthContext';

interface ConversationContextType {
  conversations: ConversationType[];
  fetchConversations: () => Promise<void>;
  loading: boolean;
  getConversation: (id: string) => Promise<ConversationType | null>;
  getMessages: (conversationId: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, content: string) => Promise<Message | null>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (!error && data) {
      // Transform the data to match ConversationType
      const typedConversations: ConversationType[] = data.map(item => ({
        id: item.id,
        match_id: item.match_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user1_id: item.user1_id,
        user2_id: item.user2_id
      }));
      setConversations(typedConversations);
    }
    setLoading(false);
  };

  const getConversation = async (id: string): Promise<ConversationType | null> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();
      
    if (!error && data) {
      return {
        id: data.id,
        match_id: data.match_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user1_id: data.user1_id,
        user2_id: data.user2_id
      };
    }
    return null;
  };

  const getMessages = async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (!error && data) return data as Message[];
    return [];
  };

  const sendMessage = async (conversationId: string, content: string): Promise<Message | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('messages')
      .insert([{ conversation_id: conversationId, sender_id: user.id, content }])
      .select()
      .single();
    if (!error && data) return data as Message;
    return null;
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return (
    <ConversationContext.Provider value={{ conversations, fetchConversations, loading, getConversation, getMessages, sendMessage }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) throw new Error('useConversations must be used within a ConversationProvider');
  return context;
};

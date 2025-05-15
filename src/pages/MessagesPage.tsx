import React, { useEffect, useState, useCallback, useRef } from 'react';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '../components/messages/ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

export interface Conversation {
  id: string;
  other_user: UserProfile;
  last_message: string;
  last_message_time: string;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  media_type?: string;
  media_url?: string;
  sender: UserProfile;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const conversationsSubRef = useRef<any>(null);
  const messagesSubRef = useRef<any>(null);
  const location = useLocation();

  // Fetch user ID and profile from Supabase auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id || null;
      setUserId(id);
      if (id) {
        supabase.from('profiles').select('id, first_name, last_name, avatar_url').eq('id', id).single().then(({ data }) => {
          if (data) setUserProfile(data);
        });
      }
    });
  }, []);

  // Fetch conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoadingConversations(true);
    try {
      // Step 1: Fetch conversations (no joins)
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('id, match_id, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      if (!convs) return;
      // Step 2: Fetch matches for these conversations
      const matchIds = convs.map((c: any) => c.match_id);
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id')
        .in('id', matchIds);
      if (matchError) throw matchError;
      // Step 3: Collect all other user IDs
      const otherUserIds = matches
        .map((m: any) => (m.user1_id === userId ? m.user2_id : m.user1_id));
      // Step 4: Fetch all needed profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', otherUserIds);
      if (profileError) throw profileError;
      const profileMap = new Map();
      (profiles || []).forEach((p: any) => profileMap.set(p.id, p));
      // Step 5: Map to Conversation[]
      const mapped: Conversation[] = convs.map((c: any) => {
        const match = matches.find((m: any) => m.id === c.match_id);
        if (!match) return null;
        const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;
        return {
          id: c.id,
          other_user: profileMap.get(otherId) || { id: otherId, first_name: '', last_name: '', avatar_url: '' },
          last_message: '', // Optionally fetch last message separately if needed
          last_message_time: '', // Optionally fetch last message time separately if needed
        };
      }).filter(Boolean);
      setConversations(mapped);
    } catch (err) {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [userId]);

  // Listen for new conversations in real time
  useEffect(() => {
    if (!userId) return;
    fetchConversations();
    if (conversationsSubRef.current) conversationsSubRef.current.unsubscribe();
    conversationsSubRef.current = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
      .subscribe();
    return () => {
      if (conversationsSubRef.current) conversationsSubRef.current.unsubscribe();
    };
  }, [userId, fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select(`
          id, content, sender_id, created_at,
          sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Map and filter messages to ensure sender is a valid UserProfile
      const validMsgs = (msgs || []).map((m: any) => {
        if (m.sender && m.sender.id) return m;
        return null;
      }).filter(Boolean) as Message[];
      setMessages(validMsgs);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Listen for new messages in real time
  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.id);
    if (messagesSubRef.current) messagesSubRef.current.unsubscribe();
    messagesSubRef.current = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selected.id}`
      }, () => fetchMessages(selected.id))
      .subscribe();
    return () => {
      if (messagesSubRef.current) messagesSubRef.current.unsubscribe();
    };
  }, [selected, fetchMessages]);

  // Handle conversation selection
  const handleSelect = (conv: Conversation) => {
    setSelected(conv);
    fetchMessages(conv.id);
  };

  // Handle sending a message
  const handleSend = async (msg: string, mediaType?: string, mediaUrl?: string) => {
    if (!selected || !userId || !userProfile) return;
    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content: msg,
      sender_id: userId,
      created_at: new Date().toISOString(),
      media_type: mediaType,
      media_url: mediaUrl,
      sender: userProfile,
    };
    setMessages(prev => [...prev, optimistic]);
    // Send to Supabase
    const payload = {
      content: msg,
      conversation_id: selected.id,
      sender_id: userId,
      created_at: new Date().toISOString(),
      media_type: mediaType,
      media_url: mediaUrl,
    };
    console.log('Sending message payload:', payload);
    const { error, data } = await supabase
      .from('messages')
      .insert(payload);
    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      alert('Failed to send message: ' + error.message);
    } else {
      console.log('Message sent successfully:', data);
    }
  };

  // Helper to get query param
  function getConversationIdFromQuery() {
    const params = new URLSearchParams(location.search);
    return params.get('conversationId');
  }

  // Auto-select conversation if conversationId is in URL
  useEffect(() => {
    const conversationId = getConversationIdFromQuery();
    if (conversationId && conversations.length > 0) {
      const found = conversations.find(c => c.id === conversationId);
      if (found) setSelected(found);
    }
  }, [location.search, conversations]);

  useEffect(() => {
    // Debug: Check Supabase session and conversations access
    supabase.auth.getSession().then((session) => {
      console.log('Supabase session:', session);
    });
    supabase.from('conversations').select('*').then((result) => {
      console.log('Conversations table access:', result);
    });
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#FFFBF0] min-h-0">
      {/* Sidebar */}
      <aside className="w-80 border-r border-[#FACC15]/30 bg-[#FFFFFF]">
        <ConversationList
          conversations={conversations}
          loading={loadingConversations}
          selectedId={selected?.id}
          onSelect={handleSelect}
        />
      </aside>
      {/* Chat Window */}
      <main className="flex-1 flex flex-col min-h-0">
        <ChatWindow
          conversation={selected}
          messages={messages}
          loading={loadingMessages}
          onSend={handleSend}
          userId={userId}
        />
      </main>
    </div>
  );
} 
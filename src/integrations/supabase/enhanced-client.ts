
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Enhanced Supabase client with typed methods
class EnhancedSupabaseClient {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  get auth() {
    return this.client.auth;
  }

  get storage() {
    return this.client.storage;
  }

  get rpc() {
    return this.client.rpc;
  }

  // Typed methods for common tables
  async fetchUserProfile(userId: string) {
    return this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  }

  async updateUserProfile(userId: string, data: Partial<Database['public']['Tables']['profiles']['Update']>) {
    return this.client
      .from('profiles')
      .update(data)
      .eq('id', userId);
  }

  async fetchUserMatches(userId: string) {
    return this.client
      .from('matches')
      .select(`
        *,
        profiles_user1: profiles!matches_user1_id_fkey(*),
        profiles_user2: profiles!matches_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });
  }

  async updateMatch(matchId: string, data: Partial<Database['public']['Tables']['matches']['Update']>) {
    return this.client
      .from('matches')
      .update(data)
      .eq('id', matchId);
  }

  async fetchConversations(userId: string) {
    return this.client
      .from('conversations')
      .select(`
        *,
        match:matches(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
  }

  async fetchMessages(conversationId: string) {
    return this.client
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
  }

  async sendMessage(
    conversationId: string, 
    senderId: string, 
    content: string
  ) {
    return this.client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        is_read: false
      })
      .select()
      .single();
  }

  async fetchUserNotifications(userId: string) {
    return this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  // Fetch user personality traits
  async fetchUserPersonalityTraits(userId: string) {
    try {
      return this.client
        .from('user_personality_traits')
        .select(`
          *,
          trait:personality_traits(*)
        `)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error fetching personality traits:', error);
      return { data: null, error };
    }
  }
}

// Create an enhanced client instance
const enhancedSupabase = new EnhancedSupabaseClient(supabase);

export { enhancedSupabase };
export default enhancedSupabase;

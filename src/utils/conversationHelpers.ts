import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Finds or creates a conversation for a given match_id. Returns the conversation ID.
 */
export async function findOrCreateConversationByMatchId(matchId: string): Promise<string | null> {
  try {
    console.log('findOrCreateConversationByMatchId called with matchId:', matchId);
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }
    
    // 1. Try to find existing conversation for this match
    const { data: existing, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
      
    if (error) {
      console.error('Error finding conversation:', error);
      // Continue to create if not found (PGRST116 error)
      if (error.code !== 'PGRST116') {
        return null;
      }
    }
    
    if (existing && existing.id) {
      console.log('Found existing conversation:', existing.id);
      return existing.id;
    }
    
    // 2. Find match details to get both user IDs
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('id', matchId)
      .single();
      
    if (matchError) {
      console.error('Error fetching match data:', matchError);
      return null;
    }
    
    // 3. Create new conversation with proper user IDs
    const { user1_id, user2_id } = matchData;
    
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({ 
        match_id: matchId,
        user1_id: user1_id,
        user2_id: user2_id
      })
      .select('id')
      .single();
      
    if (createError) {
      console.error('Error creating conversation:', createError);
      return null;
    }
    
    if (created && created.id) {
      console.log('Created new conversation:', created.id);
      return created.id;
    }
    
    console.warn('No conversation could be found or created for matchId:', matchId);
    return null;
  } catch (err) {
    console.error('Exception in findOrCreateConversationByMatchId:', err);
    return null;
  }
} 
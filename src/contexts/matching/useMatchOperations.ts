
// Let's fix the TypeScript error related to the status parameter
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MatchType } from './types';

export const useMatchOperations = () => {
  const { user } = useAuth();

  const createMatch = async (matchUserId: string) => {
    if (!user) return;

    try {
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${matchUserId},user2_id.eq.${matchUserId}`)
        .limit(1);

      if (existingMatch && existingMatch.length > 0) {
        toast({
          title: 'Match already exists',
          description: 'You already have a match with this user',
          variant: 'destructive',
        });
        return;
      }

      // Create new match
      const { error } = await supabase.from('matches').insert([
        {
          user1_id: user.id,
          user2_id: matchUserId,
          status: 'pending',
          user1_status: 'accepted',
          user2_status: 'pending',
          initiator_id: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Match created',
        description: 'You have successfully sent a match request',
      });
    } catch (error: any) {
      toast({
        title: 'Error creating match',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const acceptMatch = async (matchId: string) => {
    if (!user) return;

    try {
      // Fix: Change 'accept' string to explicit typing
      await updateMatchStatus(matchId, 'accepted');

      toast({
        title: 'Match accepted',
        description: 'You have successfully accepted the match',
      });
    } catch (error: any) {
      toast({
        title: 'Error accepting match',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const rejectMatch = async (matchId: string) => {
    if (!user) return;

    try {
      // Fix: Change 'reject' string to explicit typing
      await updateMatchStatus(matchId, 'rejected');

      toast({
        title: 'Match rejected',
        description: 'You have successfully rejected the match',
      });
    } catch (error: any) {
      toast({
        title: 'Error rejecting match',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateMatchStatus = async (matchId: string, status: string) => {
    if (!user) return;

    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      let updates = {};
      
      if (match.user1_id === user.id) {
        updates = { user1_status: status };
      } else if (match.user2_id === user.id) {
        updates = { user2_status: status };
      }

      // If both users have accepted, update the match status
      if (
        (match.user1_id === user.id && status === 'accepted' && match.user2_status === 'accepted') ||
        (match.user2_id === user.id && status === 'accepted' && match.user1_status === 'accepted')
      ) {
        updates = { ...updates, status: 'accepted' };
      }

      // If one user has rejected, update the match status
      if (status === 'rejected') {
        updates = { ...updates, status: 'rejected' };
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);

      if (updateError) throw updateError;
    } catch (error: any) {
      throw error;
    }
  };

  return { createMatch, acceptMatch, rejectMatch, updateMatchStatus };
};

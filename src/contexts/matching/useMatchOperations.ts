
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MatchType, MatchStatus } from './types';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { useMatchTransform } from './useMatchTransform';

export const useMatchOperations = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { transformMatchData } = useMatchTransform();

  // Fetch all matches for the current user
  const fetchMatches = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load regular matches
      const { data: regularMatches, error: regularError } = await supabase
        .from('matches')
        .select(`
          *,
          profiles_user1:user1_id(id, first_name, last_name, avatar_url, bio, nationality, student_type, major_id, interests, languages, university_id),
          profiles_user2:user2_id(id, first_name, last_name, avatar_url, bio, nationality, student_type, major_id, interests, languages, university_id)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (regularError) throw regularError;
      
      // Transform the data to make it more useful for the UI
      const transformedMatches = transformMatchData(regularMatches, user.id);
      setMatches(transformedMatches);
    } catch (err: any) {
      console.error('Error fetching matches:', err);
      setError(new Error('Failed to load matches'));
      toast.error('Failed to load your matches');
    } finally {
      setLoading(false);
    }
  };

  // Find a match by ID
  const getMatchById = (matchId: string): MatchType | undefined => {
    return matches.find(match => match.id === matchId);
  };
  
  // Find a match by the other user's ID
  const getMatchByUserId = (userId: string): MatchType | undefined => {
    return matches.find(match => 
      (match.user1_id === userId && match.user2_id === user?.id) || 
      (match.user1_id === user?.id && match.user2_id === userId)
    );
  };

  // Accept a match
  const acceptMatch = async (matchId: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const matchToAccept = matches.find(m => m.id === matchId);
      if (!matchToAccept) throw new Error('Match not found');
      
      // Determine which user is accepting
      const isUser1 = matchToAccept.user1_id === user.id;
      const updateField = isUser1 ? 'user1_status' : 'user2_status';
      const otherField = isUser1 ? 'user2_status' : 'user1_status';
      
      // Update the match
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          [updateField]: 'accepted',
          // Update overall status to 'accepted' if both users have accepted
          status: matchToAccept[otherField as keyof MatchType] === 'accepted' ? 'accepted' : 'pending'
        })
        .eq('id', matchId);
        
      if (updateError) throw updateError;
      
      // Create a conversation if both users have accepted
      if (matchToAccept[otherField as keyof MatchType] === 'accepted') {
        const { error: convError } = await supabase
          .from('conversations')
          .insert({
            match_id: matchId,
            user1_id: matchToAccept.user1_id,
            user2_id: matchToAccept.user2_id
          });
          
        if (convError) {
          console.error("Error creating conversation:", convError);
          // Don't throw here, as the match acceptance was successful
        } else {
          toast.success("Match accepted! You can now start chatting.");
        }
      } else {
        toast.success("Match accepted! Waiting for the other person to accept.");
      }
      
      // Update local state
      await fetchMatches();
      
    } catch (err: any) {
      console.error('Error accepting match:', err);
      setError(new Error('Failed to accept match'));
      toast.error('Failed to accept this match');
    } finally {
      setLoading(false);
    }
  };

  // Reject a match
  const rejectMatch = async (matchId: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const matchToReject = matches.find(m => m.id === matchId);
      if (!matchToReject) throw new Error('Match not found');
      
      // Determine which user is rejecting
      const isUser1 = matchToReject.user1_id === user.id;
      const updateField = isUser1 ? 'user1_status' : 'user2_status';
      
      // Update the match
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          [updateField]: 'rejected',
          status: 'rejected'  // Overall status changes to rejected if either user rejects
        })
        .eq('id', matchId);
        
      if (updateError) throw updateError;
      
      toast.success("Match rejected successfully");
      
      // Update local state
      await fetchMatches();
      
    } catch (err: any) {
      console.error('Error rejecting match:', err);
      setError(new Error('Failed to reject match'));
      toast.error('Failed to reject this match');
    } finally {
      setLoading(false);
    }
  };

  // Unmatch a user
  const unmatchUser = async (matchId: string) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Update match status to unmatched
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'unmatched' })
        .eq('id', matchId);
        
      if (updateError) throw updateError;
      
      toast.success("Successfully unmatched");
      
      // Update local state
      await fetchMatches();
      
    } catch (err: any) {
      console.error('Error unmatching user:', err);
      setError(new Error('Failed to unmatch user'));
      toast.error('Failed to unmatch this user');
    } finally {
      setLoading(false);
    }
  };

  // Get lists of matches by status
  const getPendingMatches = () => {
    return matches.filter(m => m.status === 'pending');
  };

  const getAcceptedMatches = () => {
    return matches.filter(m => m.status === 'accepted');
  };

  return {
    matches,
    pendingMatches: getPendingMatches(),
    acceptedMatches: getAcceptedMatches(),
    loading,
    error,
    fetchMatches,
    acceptMatch,
    rejectMatch,
    unmatchUser,
    getMatchById,
    getMatchByUserId
  };
};

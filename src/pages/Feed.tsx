import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProfileType, MatchType } from '@/types/database';
import MatchCard from '@/components/matches/MatchCard';
import { useMatchOperations } from '@/contexts/matching/useMatchOperations';
import { toast } from '@/hooks/use-toast';

const Feed = () => {
  const { user } = useAuth();
  const { 
    matches, 
    suggestedMatches,
    loading, 
    fetchMatches,
    fetchSuggestedMatches,
    createMatch,
    acceptMatch, 
    rejectMatch 
  } = useMatchOperations();
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [formattedMatches, setFormattedMatches] = useState<MatchType[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchMatches();
      fetchSuggestedMatches();
    }
  }, [user?.id, fetchMatches, fetchSuggestedMatches]);

  // Format suggested matches to match the MatchType structure
  useEffect(() => {
    if (suggestedMatches && suggestedMatches.length > 0) {
      const formatted = suggestedMatches.map(profile => {
        // Extract nested object values
        const universityName = typeof profile.university === 'object' && profile.university !== null 
          ? profile.university.name 
          : profile.university;
        
        const majorName = typeof profile.major === 'object' && profile.major !== null 
          ? profile.major.name 
          : profile.major;
        
        const campusName = typeof profile.campus === 'object' && profile.campus !== null 
          ? profile.campus.name 
          : profile.campus;

        return {
          id: profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user1_id: user?.id || '',
          user2_id: profile.id,
          status: 'pending' as const,
          user1_status: 'accepted',
          user2_status: 'pending',
          otherUser: {
            id: profile.id,
            first_name: profile.first_name || 'Unknown',
            last_name: profile.last_name || 'User',
            avatar_url: profile.avatar_url || null,
            university: universityName || null,
            student_type: profile.student_type || null,
            major: majorName || null,
            bio: profile.bio || null,
            nationality: profile.nationality || null,
            is_verified: profile.is_verified || false,
            common_interests: profile.common_interests || 0,
            common_languages: profile.common_languages || 0,
            match_score: profile.match_score || 0
          }
        };
      });
      setFormattedMatches(formatted);
    }
  }, [suggestedMatches, user?.id]);

  const handleAccept = async (matchId: string) => {
    try {
      await createMatch(matchId);
      toast({
        title: "Match request sent!",
        description: "Waiting for the other person to accept your match request.",
      });
      setCurrentMatchIndex(prev => Math.min(prev + 1, (formattedMatches?.length || 0) - 1));
    } catch (err) {
      console.error('Error creating match:', err);
      toast({
        title: "Error",
        description: "Failed to send match request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      setCurrentMatchIndex(prev => Math.min(prev + 1, (formattedMatches?.length || 0) - 1));
    } catch (err) {
      console.error('Error rejecting match:', err);
      toast({
        title: "Error",
        description: "Failed to process your action. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!formattedMatches?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-2">No matches found</h2>
        <p className="text-gray-500 text-center">
          Check back later for new matches or update your profile to improve your matching chances.
        </p>
      </div>
    );
  }

  const currentMatch = formattedMatches[currentMatchIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <MatchCard
          match={currentMatch}
          isPending={true}
          onAccept={() => handleAccept(currentMatch.otherUser.id)}
          onReject={() => handleReject(currentMatch.otherUser.id)}
        />
      </div>
    </div>
  );
};

export default Feed;

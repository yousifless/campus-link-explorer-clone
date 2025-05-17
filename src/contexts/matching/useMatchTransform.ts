
import { MatchType } from './types';

export const useMatchTransform = () => {
  const transformMatchData = (rawMatches: any[], userId: string): MatchType[] => {
    if (!rawMatches || !Array.isArray(rawMatches)) return [];
    
    return rawMatches.map((match: any) => {
      const isUser1 = match.user1_id === userId;
      const otherUserId = isUser1 ? match.user2_id : match.user1_id;
      
      const otherUserProfile = isUser1 
        ? (match.profiles_user2 || {}) 
        : (match.profiles_user1 || {});

      return {
        id: match.id,
        user1_id: match.user1_id,
        user2_id: match.user2_id,
        status: match.status,
        user1_status: match.user1_status,
        user2_status: match.user2_status,
        created_at: match.created_at,
        updated_at: match.updated_at,
        initiator_id: match.initiator_id || match.user1_id, // Use user1_id as fallback
        otherUser: {
          id: otherUserId,
          first_name: otherUserProfile.first_name || '',
          last_name: otherUserProfile.last_name || '',
          avatar_url: otherUserProfile.avatar_url || '',
          university: otherUserProfile.university || null,
          student_type: otherUserProfile.student_type || null,
          major: otherUserProfile.major_id || null, // Use major_id instead of major
          bio: otherUserProfile.bio || null,
          nationality: otherUserProfile.nationality || null,
          is_verified: otherUserProfile.is_verified || false,
          common_interests: 0,
          common_languages: 0,
          match_score: 0
        },
      };
    });
  };

  return { transformMatchData };
};

import { supabase } from './supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MeetupLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CreateMeetupParams {
  title: string;
  description: string;
  date: Date;
  location: MeetupLocation;
  creator_id: string;
  invitee_id: string;
}

export const createMeetup = async (params: CreateMeetupParams) => {
  const { title, description, date, location, creator_id, invitee_id } = params;

  const { data, error } = await supabase
    .from('coffee_meetups')
    .insert({
      title,
      description,
      date: date.toISOString(),
      location_name: location.name,
      location_address: location.address,
      location_lat: location.lat,
      location_lng: location.lng,
      creator_id,
      invitee_id,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

interface MatchedUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface MatchResponse {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_status: string;
  user2_status: string;
  status: string;
  user1: MatchedUser;
  user2: MatchedUser;
}

export const loadMatchedUsers = async (userId: string): Promise<MatchedUser[]> => {
  try {
    // First, get the matches
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id, user1_status, user2_status, status')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'matched');

    if (matchesError) throw matchesError;
    if (!matchesData) return [];

    // Get all user IDs from matches
    const userIds = new Set<string>();
    matchesData.forEach(match => {
      userIds.add(match.user1_id);
      userIds.add(match.user2_id);
    });

    // Fetch profiles for all users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', Array.from(userIds));

    if (profilesError) throw profilesError;
    if (!profilesData) return [];

    // Create a map for easy profile lookup
    const profileMap = new Map(profilesData.map(profile => [profile.id, profile]));

    // Transform matches to include the other user's profile
    return matchesData.map(match => {
      const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
      const otherUserProfile = profileMap.get(otherUserId);

      if (!otherUserProfile) return null;

      return {
        id: otherUserProfile.id,
        first_name: otherUserProfile.first_name,
        last_name: otherUserProfile.last_name,
        avatar_url: otherUserProfile.avatar_url
      } as MatchedUser;
    }).filter(Boolean) as MatchedUser[];
  } catch (error) {
    console.error('Error loading matched users:', error);
    toast.error('Failed to load matched users');
    return [];
  }
}; 
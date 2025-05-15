import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Club, ClubVisibility } from '@/types/clubs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useClubs = () => {
  const { user } = useAuth();
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [publicClubs, setPublicClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all clubs the user is a member of
  const fetchUserClubs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Use the stored procedure for getting user clubs
      const { data, error } = await supabase
        .rpc('get_user_clubs', { user_uuid: user.id });
        
      if (error) throw error;
      
      // Convert the returned data to our Club type
      const clubsData = data?.map((club: any) => ({
        id: club.id,
        name: club.name,
        description: club.description,
        tags: club.tags || [],
        course_code: club.course_code,
        visibility: (club.visibility || 'public') as ClubVisibility,
        join_code: club.join_code,
        created_by: club.created_by,
        created_at: club.created_at,
        creator_first_name: club.creator_first_name,
        creator_last_name: club.creator_last_name,
        creator_avatar_url: club.creator_avatar_url,
        member_count: club.member_count || 0,
        upcoming_meetups_count: club.upcoming_meetups_count || 0
      } as Club)) || [];
      
      setUserClubs(clubsData);
    } catch (err) {
      console.error('Error fetching user clubs:', err);
      setError('Failed to fetch your clubs');
      toast.error('Failed to load your clubs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all public clubs
  const fetchPublicClubs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Query the club_details view instead of clubs table directly
      const { data, error } = await supabase
        .from('club_details')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Filter out clubs the user is already a member of
      const filteredClubs = data?.filter(club => 
        !userClubs.some(userClub => userClub.id === club.id)
      ) || [];
      
      // Convert the returned data to our Club type
      const clubsData = filteredClubs.map(club => ({
        id: club.id || '',
        name: club.name || '',
        description: club.description,
        tags: club.tags || [],
        course_code: club.course_code,
        visibility: (club.visibility || 'public') as ClubVisibility,
        join_code: club.join_code,
        created_by: club.created_by,
        created_at: club.created_at,
        creator_first_name: club.creator_first_name,
        creator_last_name: club.creator_last_name,
        creator_avatar_url: club.creator_avatar_url,
        member_count: club.member_count || 0,
        upcoming_meetups_count: club.upcoming_meetups_count || 0
      } as Club));
      
      setPublicClubs(clubsData);
    } catch (err) {
      console.error('Error fetching public clubs:', err);
      setError('Failed to fetch public clubs');
      toast.error('Failed to load public clubs');
    } finally {
      setLoading(false);
    }
  };

  // Create a new club
  const createClub = async (clubData: Partial<Club>) => {
    if (!user) {
      toast.error('Please sign in to create a club');
      return null;
    }
    
    try {
      // First, create the club with essential fields
      const { data: newClub, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: clubData.name!,
          description: clubData.description || null,
          tags: clubData.tags || [],
          course_code: clubData.course_code || null,
          visibility: clubData.visibility || 'public',
          join_code: clubData.visibility === 'private' 
            ? Math.random().toString(36).substring(2, 10).toUpperCase() 
            : null,
          created_by: user.id
        })
        .select('*')
        .single();
        
      if (clubError) {
        // Handle RLS policy violation
        if (clubError.code === '42501') {
          toast.error('Permission error: You may not have rights to create clubs');
        } else {
          console.error('Error creating club:', clubError);
          toast.error(`Failed to create club: ${clubError.message}`);
        }
        return null;
      }
      
      // Successfully created the club, now add the user as an admin
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .insert({
          club_id: newClub.id,
          user_id: user.id,
          role: 'admin'
        });
        
      if (membershipError) {
        // If it's just a duplicate key error, we can ignore it
        if (membershipError.code !== '23505') {
          console.error('Error adding user as admin:', membershipError);
          toast.error('Club created, but you could not be added as admin');
        }
      }
      
      toast.success('Club created successfully!');
      fetchUserClubs(); // Refresh clubs list
      
      return newClub as Club;
    } catch (err) {
      console.error('Error in club creation process:', err);
      toast.error('An unexpected error occurred while creating the club');
      return null;
    }
  };

  // Join a club (public or with join code)
  const joinClub = async (clubId: string, joinCode?: string) => {
    if (!user) {
      toast.error('Please sign in to join a club');
      return false;
    }
    
    try {
      // Check if the club is private and requires a join code
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('visibility, join_code')
        .eq('id', clubId)
        .single();
        
      if (clubError) throw clubError;
      
      // If private club, verify join code
      if (clubData.visibility === 'private') {
        if (!joinCode) {
          toast.error('This club requires a join code to join');
          return false;
        }
        
        if (joinCode !== clubData.join_code) {
          toast.error('Invalid join code');
          return false;
        }
      }
      
      // Add user to club
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .insert({
          club_id: clubId,
          user_id: user.id,
          role: 'member'
        });
        
      if (membershipError) throw membershipError;
      
      toast.success('Successfully joined club!');
      
      // Refresh user's clubs
      fetchUserClubs();
      
      return true;
    } catch (err) {
      console.error('Error joining club:', err);
      toast.error('Failed to join club');
      return false;
    }
  };

  // Leave a club
  const leaveClub = async (clubId: string) => {
    if (!user) {
      toast.error('Please sign in to leave a club');
      return false;
    }
    
    try {
      // Check if user is the club creator
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('created_by')
        .eq('id', clubId)
        .single();
        
      if (clubError) throw clubError;
      
      // Prevent club creator from leaving (they must delete the club instead)
      if (clubData.created_by === user.id) {
        toast.error('As the creator, you cannot leave this club. You can delete it instead.');
        return false;
      }
      
      // Remove user from club
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);
        
      if (membershipError) throw membershipError;
      
      toast.success('Successfully left club');
      
      // Refresh user's clubs
      fetchUserClubs();
      
      return true;
    } catch (err) {
      console.error('Error leaving club:', err);
      toast.error('Failed to leave club');
      return false;
    }
  };

  // Delete a club (only for creator or admin)
  const deleteClub = async (clubId: string) => {
    if (!user) {
      toast.error('Please sign in to delete a club');
      return false;
    }
    
    try {
      // Check if user is the club creator or an admin
      const { data: membershipData, error: membershipError } = await supabase
        .from('club_memberships')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();
        
      if (membershipError) throw membershipError;
      
      if (membershipData.role !== 'admin') {
        toast.error('Only club administrators can delete clubs');
        return false;
      }
      
      // Delete the club (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);
        
      if (deleteError) throw deleteError;
      
      toast.success('Club deleted successfully');
      
      // Refresh user's clubs
      fetchUserClubs();
      
      return true;
    } catch (err) {
      console.error('Error deleting club:', err);
      toast.error('Failed to delete club');
      return false;
    }
  };

  // Update club details (only for creator or admin)
  const updateClub = async (clubId: string, clubData: Partial<Club>) => {
    if (!user) {
      toast.error('Please sign in to update a club');
      return null;
    }
    
    try {
      // Check if user is the club creator or an admin
      const { data: membershipData, error: membershipError } = await supabase
        .from('club_memberships')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();
        
      if (membershipError) throw membershipError;
      
      if (membershipData.role !== 'admin') {
        toast.error('Only club administrators can update clubs');
        return null;
      }
      
      // Update the club
      const { data, error: updateError } = await supabase
        .from('clubs')
        .update({
          name: clubData.name,
          description: clubData.description,
          tags: clubData.tags,
          course_code: clubData.course_code,
          visibility: clubData.visibility
        })
        .eq('id', clubId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      toast.success('Club updated successfully');
      
      // Refresh user's clubs
      fetchUserClubs();
      
      return data;
    } catch (err) {
      console.error('Error updating club:', err);
      toast.error('Failed to update club');
      return null;
    }
  };

  // Load clubs when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchUserClubs();
      fetchPublicClubs();
    } else {
      setUserClubs([]);
      setPublicClubs([]);
    }
  }, [user]);

  return {
    userClubs,
    publicClubs,
    loading,
    error,
    fetchUserClubs,
    fetchPublicClubs,
    createClub,
    joinClub,
    leaveClub,
    deleteClub,
    updateClub
  };
}; 
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import CreateClubMeetupForm from '@/components/clubs/CreateClubMeetupForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Club } from '@/types/clubs';
import { ClubMeetup } from '@/types/meetings';

const EditClubMeetupPage = () => {
  const { clubId, meetupId } = useParams<{ clubId: string; meetupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [meetup, setMeetup] = useState<ClubMeetup | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!clubId || !meetupId) return;
      
      try {
        setLoading(true);
        
        // Fetch club details
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single();
          
        if (clubError) {
          toast.error('Error loading club details');
          navigate('/clubs');
          return;
        }
        
        setClub(clubData as Club);
        
        // Fetch meetup details
        const { data: meetupData, error: meetupError } = await supabase
          .from('club_meetups')
          .select('*')
          .eq('id', meetupId)
          .eq('club_id', clubId)
          .single();
          
        if (meetupError) {
          toast.error('Error loading meetup details');
          navigate(`/clubs/${clubId}`);
          return;
        }
        
        setMeetup(meetupData as ClubMeetup);
        
        // Check if user is an admin
        const { data: membership, error: membershipError } = await supabase
          .from('club_memberships')
          .select('role')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .single();
          
        if (membershipError) {
          toast.error('You do not have access to this club');
          navigate('/clubs');
          return;
        }
        
        // Only admins or the meetup creator can edit
        if (membership.role !== 'admin' && meetupData.created_by !== user.id) {
          toast.error('You do not have permission to edit this meetup');
          navigate(`/clubs/${clubId}/meetups/${meetupId}`);
          return;
        }
        
        setIsAdmin(membership.role === 'admin');
      } catch (error) {
        console.error('Error:', error);
        toast.error('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clubId, meetupId, user?.id, navigate]);

  const handleSuccess = () => {
    navigate(`/clubs/${clubId}/meetups/${meetupId}`);
    toast.success('Meetup updated successfully');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (!club || !meetup) {
    return null; // Will redirect from useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/clubs/${clubId}/meetups/${meetupId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Meetup
        </Button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold">Edit Meetup for {club.name}</h1>
          <p className="text-muted-foreground">
            Update the details for "{meetup.title}"
          </p>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <CreateClubMeetupForm 
          clubId={clubId || ''} 
          meetupToEdit={meetup}
          onSuccess={handleSuccess}
        />
      </motion.div>
    </div>
  );
};

export default EditClubMeetupPage; 
import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import CreateClubMeetupForm from '@/components/clubs/CreateClubMeetupForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Club } from '@/types/clubs';

const CreateClubMeetupPage = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const fetchClubAndPermissions = async () => {
      if (!clubId) return;
      
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
        
        // Only admins can create meetups
        if (membership.role !== 'admin') {
          toast.error('Only club admins can create meetups');
          navigate(`/clubs/${clubId}`);
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Error:', error);
        toast.error('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClubAndPermissions();
  }, [clubId, user?.id, navigate]);

  const handleSuccess = () => {
    navigate(`/clubs/${clubId}`);
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
  
  if (!isAdmin || !club) {
    return null; // Will redirect from useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/clubs/${clubId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Club
        </Button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold">Create Meetup for {club.name}</h1>
          <p className="text-muted-foreground">
            Schedule a new event for club members
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
          onSuccess={handleSuccess}
        />
      </motion.div>
    </div>
  );
};

export default CreateClubMeetupPage; 
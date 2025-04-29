
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProfileType, MatchType } from '@/types/database';
import MatchCard from '@/components/matches/MatchCard';
import { useMatchOperations } from '@/contexts/matching/useMatchOperations';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Heart, X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Feed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [universities, setUniversities] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState('');

  // Fetch reference data and matches
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch universities
        const { data: univData } = await supabase.from('universities').select('*');
        if (univData) setUniversities(univData);
        
        // Fetch majors
        const { data: majorsData } = await supabase.from('majors').select('*');
        if (majorsData) setMajors(majorsData);
        
        // Fetch languages
        const { data: langData } = await supabase.from('languages').select('*');
        if (langData) setLanguages(langData);
        
        // Fetch interests
        const { data: interestData } = await supabase.from('interests').select('*');
        if (interestData) setInterests(interestData);
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };
    
    fetchReferenceData();
  }, []);

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
            match_score: profile.match_score || 0,
            // Add additional properties that might be used in the card
            languages: profile.languages || [],
            interests: profile.interests || [],
            cultural_insight: profile.cultural_insight || null,
            year_of_study: profile.year_of_study || null,
            location: profile.location || null,
          }
        };
      });
      setFormattedMatches(formatted);
    }
  }, [suggestedMatches, user?.id]);

  const handleAccept = async (matchId: string) => {
    try {
      setActionLoading('accept');
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
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      setActionLoading('reject');
      setCurrentMatchIndex(prev => Math.min(prev + 1, (formattedMatches?.length || 0) - 1));
    } catch (err) {
      console.error('Error rejecting match:', err);
      toast({
        title: "Error",
        description: "Failed to process your action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading('');
    }
  };

  const navigateMatches = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentMatchIndex < formattedMatches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    } else if (direction === 'prev' && currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-lg font-medium text-gray-700">Finding potential matches...</p>
          <p className="text-sm text-gray-500 mt-2">This might take a moment</p>
        </div>
      </div>
    );
  }

  if (!formattedMatches?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Heart className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No matches found</h2>
          <p className="text-gray-500 mb-6">
            We're still looking for great matches for you. Check back later or update your profile to improve your matching chances.
          </p>
          <Button 
            onClick={() => fetchSuggestedMatches()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            Refresh Matches
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentMatch = formattedMatches[currentMatchIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Discover Students</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              disabled={currentMatchIndex === 0}
              onClick={() => navigateMatches('prev')}
              className="border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              disabled={currentMatchIndex === formattedMatches.length - 1}
              onClick={() => navigateMatches('next')}
              className="border-gray-200 hover:bg-gray-50"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <p className="text-gray-500 mb-6 text-center">
          Showing {currentMatchIndex + 1} of {formattedMatches.length} potential connections
        </p>
        
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMatch.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <MatchCard
                match={currentMatch}
                isPending={true}
                onAccept={() => handleAccept(currentMatch.otherUser.id)}
                onReject={() => handleReject(currentMatch.otherUser.id)}
                universities={universities}
                majors={majors}
                languages={languages}
                interests={interests}
              />
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-center mt-8 space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full w-16 h-16 flex items-center justify-center bg-white border border-red-300 text-red-500 shadow-lg hover:bg-red-50 transition-colors"
              onClick={() => handleReject(currentMatch.otherUser.id)}
              disabled={actionLoading === 'reject'}
            >
              {actionLoading === 'reject' ? (
                <Loader className="h-8 w-8 animate-spin" />
              ) : (
                <X className="h-8 w-8" />
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full w-16 h-16 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-colors"
              onClick={() => handleAccept(currentMatch.otherUser.id)}
              disabled={actionLoading === 'accept'}
            >
              {actionLoading === 'accept' ? (
                <Loader className="h-8 w-8 animate-spin" />
              ) : (
                <Heart className="h-8 w-8 fill-current" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;

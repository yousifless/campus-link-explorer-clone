import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HybridMatchCard } from '@/components/matches/HybridMatchCard';
import { useHybridMatching } from '@/hooks/useHybridMatching';
import { useMatching } from '@/contexts/matching';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Feed = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, fetchMatches } = useMatching();
  const navigate = useNavigate();
  
  const { 
    matches: hybridMatches,
    weights,
    loading: hybridLoading,
    error,
    updateWeight,
    resetWeights
  } = useHybridMatching();
  
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const navigateMatches = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentMatchIndex < hybridMatches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    } else if (direction === 'prev' && currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    }
  };

  const handleAccept = async (userId: string) => {
    try {
      // Find the corresponding match from standard matches
      await acceptMatch(userId);
      toast({
        title: "Match request sent!",
        description: "Waiting for the other person to accept your match request.",
      });
      // Move to next match if available
      if (currentMatchIndex < hybridMatches.length - 1) {
        setCurrentMatchIndex(currentMatchIndex + 1);
      }
      return Promise.resolve();
    } catch (err) {
      console.error('Error creating match:', err);
      toast({
        title: "Error",
        description: "Failed to send match request. Please try again.",
        variant: "destructive",
      });
      return Promise.reject(err);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      // Skip to next match if available
      if (currentMatchIndex < hybridMatches.length - 1) {
        setCurrentMatchIndex(currentMatchIndex + 1);
      }
      
      // Create and then reject the match in the background
      await acceptMatch(userId).then(() => {
        fetchMatches().then(() => {
          rejectMatch(userId);
        });
      });
      return Promise.resolve();
    } catch (err) {
      console.error('Error rejecting match:', err);
      toast({
        title: "Error",
        description: "Failed to process your action. Please try again.",
        variant: "destructive",
      });
      return Promise.reject(err);
    }
  };

  const handleMessage = async (userId: string) => {
    try {
      // First create a match if it doesn't exist
      await acceptMatch(userId);
      // Then redirect to messages (handled by the component)
    } catch (err) {
      console.error('Error in handleMessage:', err);
      toast({
        title: "Error",
        description: "Could not start a chat. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const navigateToProfileSettings = () => {
    navigate('/profile');
  };

  if (hybridLoading && hybridMatches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-lg font-medium text-gray-700">Finding your best matches...</p>
          <p className="text-sm text-gray-500 mt-2">This might take a moment</p>
        </div>
      </div>
    );
  }

    return (
        <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto px-4 py-8"
        >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Smart Matching</h2>
          <p className="text-muted-foreground">
            Find your perfect connections with our AI-powered matching algorithm
          </p>
        </div>
        
          <Button 
          variant="outline" 
          size="sm" 
          onClick={navigateToProfileSettings}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          <span>Adjust Preferences</span>
          </Button>
      </div>

      {hybridMatches.length > 0 ? (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
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
                disabled={currentMatchIndex === hybridMatches.length - 1}
              onClick={() => navigateMatches('next')}
              className="border-gray-200 hover:bg-gray-50"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
            
            <p className="text-gray-500 text-center">
              Showing {currentMatchIndex + 1} of {hybridMatches.length} potential connections
            </p>
        </div>
        
          <AnimatePresence mode="wait">
            <motion.div
              key={hybridMatches[currentMatchIndex]?.userId}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <HybridMatchCard
                match={hybridMatches[currentMatchIndex]}
                onAccept={handleAccept}
                onReject={handleReject}
                onMessage={handleMessage}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-lg"
          >
            <h2 className="text-2xl font-bold mb-2">No matches found</h2>
            <p className="text-gray-500 mb-6">
              We're still looking for great matches for you. Update your profile or adjust your matching preferences to improve your matching chances.
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={resetWeights}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                Reset Preferences
              </Button>
              <Button 
                variant="outline"
                onClick={navigateToProfileSettings}
              >
                Adjust Preferences
              </Button>
          </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Feed;

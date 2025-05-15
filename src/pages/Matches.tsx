import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMatching } from '@/contexts/matching';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Coffee, 
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MatchCard from '@/components/matches/MatchCard';
import GlobalMatchCard from '@/components/matches/GlobalMatchCard';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { findOrCreateConversationByMatchId } from '@/utils/conversationHelpers';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

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

const Matches = () => {
  const { 
    matches, 
    fetchMatches, 
    acceptMatch, 
    rejectMatch,
    unmatchUser,
    loading 
  } = useMatching();
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: currentUserProfile } = useProfile();
  const { toast } = useToast();
  const [unmatchDialogOpen, setUnmatchDialogOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleAccept = async (matchId: string) => {
    await acceptMatch(matchId);
  };

  const handleReject = async (matchId: string) => {
    await rejectMatch(matchId);
  };

  const handleMessage = async (matchId: string) => {
    try {
      const conversationId = await findOrCreateConversationByMatchId(matchId);
      if (conversationId) {
        navigate(`/messages?conversationId=${conversationId}`);
      } else {
        toast({
          title: 'Error',
          description: 'Could not start a chat. Please try again or contact support.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error in handleMessage:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while starting the chat. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenUnmatchDialog = (matchId: string) => {
    setSelectedMatchId(matchId);
    setUnmatchDialogOpen(true);
    return Promise.resolve();
  };

  const handleUnmatch = async () => {
    if (selectedMatchId) {
      await unmatchUser(selectedMatchId);
      setUnmatchDialogOpen(false);
      setSelectedMatchId(null);
    }
  };

  if (loading && matches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Matches</h2>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
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
      <h2 className="text-2xl font-bold mb-2">Your Matches</h2>
      <p className="text-muted-foreground mb-6">
        Connect and chat with your matched students
      </p>
      
      {matches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <motion.div key={match.id} variants={itemVariants}>
              <GlobalMatchCard
                userId={match.otherUser.id}
                matchId={match.id}
                match_score={match.otherUser.match_score || 75}
                isMatched={true}
                onMessage={() => handleMessage(match.id)}
                onUnmatch={() => handleOpenUnmatchDialog(match.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-lg"
            >
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Coffee className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No matches yet</h2>
            <p className="text-gray-500 mb-6">
              Visit the Feed to discover and connect with other students. Once you match, they'll appear here.
            </p>
            <Button 
              onClick={() => navigate('/feed')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              Discover Students
            </Button>
                  </motion.div>
        </div>
          )}

      {/* Unmatch Confirmation Dialog */}
      <Dialog open={unmatchDialogOpen} onOpenChange={setUnmatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Unmatch Confirmation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unmatch with this person? This action cannot be undone.
              They will no longer appear in your matches and you won't be able to message each other.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleUnmatch}
            >
              Unmatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Matches;

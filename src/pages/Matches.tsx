import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMatching } from '@/contexts/matching';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    myPendingMatches, 
    theirPendingMatches, 
    fetchMatches, 
    acceptMatch, 
    rejectMatch, 
    loading 
  } = useMatching();
  const navigate = useNavigate();

  // State for universities, majors, languages, interests
  const [universities, setUniversities] = useState([]);
  const [majors, setMajors] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [interests, setInterests] = useState([]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    // Fetch universities
    const fetchUniversities = async () => {
      const { data, error } = await supabase.from('universities').select('id, name');
      if (!error && data) setUniversities(data);
    };
    // Fetch majors
    const fetchMajors = async () => {
      const { data, error } = await supabase.from('majors').select('id, name');
      if (!error && data) setMajors(data);
    };
    // Fetch languages
    const fetchLanguages = async () => {
      const { data, error } = await supabase.from('languages').select('id, name');
      if (!error && data) setLanguages(data);
    };
    // Fetch interests
    const fetchInterests = async () => {
      const { data, error } = await supabase.from('interests').select('id, name');
      if (!error && data) setInterests(data);
    };
    fetchUniversities();
    fetchMajors();
    fetchLanguages();
    fetchInterests();
  }, []);

  const pendingMatches = [...myPendingMatches, ...theirPendingMatches];
  const acceptedMatches = matches;

  const handleAccept = async (matchId: string) => {
    await acceptMatch(matchId);
  };

  const handleReject = async (matchId: string) => {
    await rejectMatch(matchId);
  };

  const handleMessage = (matchId: string) => {
    navigate(`/chat/${matchId}`);
  };

  // Add mapping utility
  function mapMatchToProfileCard(match, universities, majors, languages, interests) {
    const other = match.otherUser;
    const university = universities.find(u => u.id === other.university)?.name || other.university || '';
    const major = majors.find(m => m.id === other.major)?.name || other.major || '';
    const studentType: 'local' | 'international' = other.student_type === 'international' ? 'international' : 'local';
    // Map language IDs to names
    const userLanguages = (Array.isArray(other.languages) ? other.languages : []).map(lang => {
      const langObj = languages.find(l => l.id === lang.id);
      return langObj ? langObj.name : lang.id;
    });
    // Map interest IDs to names
    const userInterests = (Array.isArray(other.interests) ? other.interests : []).map(interestId => {
      const interestObj = interests.find(i => i.id === interestId);
      return interestObj ? interestObj.name : interestId;
    });
    return {
      id: other.id,
      name: `${other.first_name} ${other.last_name}`,
      avatar: other.avatar_url,
      university,
      major,
      studentType,
      interests: userInterests,
      languages: userLanguages,
      bio: other.bio || '',
      matchPercentage: other.match_score
    };
  }

  if (loading && matches.length === 0 && pendingMatches.length === 0) {
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
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Your Matches</h2>
        <Button onClick={() => navigate('/feed')} variant="outline">
          <Coffee className="mr-2 h-4 w-4" />
          Discover More
        </Button>
      </motion.div>
      
      <Tabs defaultValue="accepted" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="accepted" className="flex-1">
            Connected ({acceptedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pending ({pendingMatches.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="accepted">
          {acceptedMatches.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="text-center py-8"
            >
              <h3 className="text-lg font-medium mb-2">No matches yet</h3>
              <p className="text-muted-foreground mb-4">
                Visit the Discover tab to find and connect with other students.
              </p>
              <Button onClick={() => navigate('/feed')}>Discover Students</Button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {acceptedMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  variants={itemVariants}
                  custom={index}
                >
                  <ProfileCard
                    profile={mapMatchToProfileCard(match, universities, majors, languages, interests)}
                    onConnect={() => handleAccept(match.id)}
                    onMessage={() => handleMessage(match.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {pendingMatches.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="text-center py-8"
            >
              <h3 className="text-lg font-medium mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                When you send or receive connection requests, they'll appear here.
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {pendingMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  variants={itemVariants}
                  custom={index}
                >
                  <ProfileCard
                    profile={mapMatchToProfileCard(match, universities, majors, languages, interests)}
                    onConnect={() => handleAccept(match.id)}
                    onMessage={() => handleMessage(match.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Matches;

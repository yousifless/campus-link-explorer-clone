
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMatching } from '@/contexts/matching';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Coffee, ArrowRight, Filter, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedProfileCard } from '@/components/profile/EnhancedProfileCard';
import { Input } from '@/components/ui/input';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'international' | 'local'>('all');

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

  const handleMeetup = (matchId: string) => {
    navigate(`/meetup/${matchId}`);
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
      return {
        name: langObj ? langObj.name : lang.id,
        proficiency: lang.proficiency
      };
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
      matchPercentage: Math.round(other.match_score || 0),
      nationality: other.nationality,
      location: other.location,
      year: other.year_of_study,
      culturalInsight: other.cultural_insight
    };
  }

  // Filter matches based on search query and filters
  const filterMatches = (matches) => {
    return matches.filter(match => {
      const profile = mapMatchToProfileCard(match, universities, majors, languages, interests);
      
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery || 
        profile.name.toLowerCase().includes(searchLower) || 
        profile.university.toLowerCase().includes(searchLower) || 
        profile.major.toLowerCase().includes(searchLower) || 
        profile.interests.some(i => i.toLowerCase().includes(searchLower));
      
      // Filter by student type
      const matchesType = 
        activeFilter === 'all' || 
        (activeFilter === 'international' && profile.studentType === 'international') ||
        (activeFilter === 'local' && profile.studentType === 'local');
      
      return matchesSearch && matchesType;
    });
  };

  const filteredAcceptedMatches = filterMatches(acceptedMatches);
  const filteredPendingMatches = filterMatches(pendingMatches);

  if (loading && matches.length === 0 && pendingMatches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.h2 
          className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-pink"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Your Matches
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
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
      <motion.div 
        variants={itemVariants} 
        className="flex items-center justify-between mb-8"
      >
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-pink">
          Your Matches
        </h2>
        <Button 
          onClick={() => navigate('/feed')} 
          className="bg-gradient-to-r from-brand-blue to-brand-purple text-white hover:shadow-lg transition-all duration-300"
        >
          <Coffee className="mr-2 h-4 w-4" />
          Discover More
        </Button>
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name, university, major, or interests..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeFilter === 'all' ? "default" : "outline"}
              onClick={() => setActiveFilter('all')}
              className={activeFilter === 'all' ? "bg-brand-purple text-white" : ""}
            >
              All
            </Button>
            <Button
              variant={activeFilter === 'international' ? "default" : "outline"}
              onClick={() => setActiveFilter('international')}
              className={activeFilter === 'international' ? "bg-brand-pink text-white" : ""}
            >
              International
            </Button>
            <Button
              variant={activeFilter === 'local' ? "default" : "outline"}
              onClick={() => setActiveFilter('local')}
              className={activeFilter === 'local' ? "bg-brand-blue text-white" : ""}
            >
              Local
            </Button>
          </div>
        </div>
      </motion.div>
      
      <Tabs defaultValue="accepted" className="w-full">
        <TabsList className="w-full mb-6 bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger 
            value="accepted" 
            className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Connected ({filteredAcceptedMatches.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Pending ({filteredPendingMatches.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="accepted">
          <AnimatePresence>
            {filteredAcceptedMatches.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center py-16 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="mb-4 h-20 w-20 bg-gray-100 dark:bg-gray-700 mx-auto rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No matches found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || activeFilter !== 'all' ? 
                      "Try changing your search or filters to see more results." :
                      "Visit the Discover tab to find and connect with other students."}
                  </p>
                  <Button onClick={() => navigate('/feed')} className="bg-gradient-to-r from-brand-purple to-brand-pink text-white">
                    Discover Students <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredAcceptedMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    variants={itemVariants}
                    custom={index}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    <EnhancedProfileCard
                      profile={mapMatchToProfileCard(match, universities, majors, languages, interests)}
                      onMessage={() => handleMessage(match.id)}
                      onMeetup={() => handleMeetup(match.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
        
        <TabsContent value="pending">
          <AnimatePresence>
            {filteredPendingMatches.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center py-16 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="mb-4 h-20 w-20 bg-gray-100 dark:bg-gray-700 mx-auto rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No pending matches</h3>
                  <p className="text-muted-foreground mb-6">
                    When you send or receive connection requests, they'll appear here.
                  </p>
                  <Button onClick={() => navigate('/feed')} className="bg-gradient-to-r from-brand-purple to-brand-pink text-white">
                    Discover Students <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredPendingMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    variants={itemVariants}
                    custom={index}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    <EnhancedProfileCard
                      profile={mapMatchToProfileCard(match, universities, majors, languages, interests)}
                      onConnect={() => handleAccept(match.id)}
                      onMessage={() => handleReject(match.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Matches;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useMatching } from '@/contexts/matching';
import GlobalMatchCard from '@/components/matches/GlobalMatchCard';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { 
  HeartHandshake, 
  RefreshCw, 
  Sliders,
  ChevronRight,
  Users,
  UserPlus,
  UserMinus,
  Search
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MatchingPreferences } from '@/components/matches/MatchingPreferences';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const SmartMatchingPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { 
    suggestedMatches: hookSuggestedMatches,
    fetchSuggestedMatches: hookFetchSuggestedMatches,
    acceptMatch: hookAcceptMatch, 
    rejectMatch: hookRejectMatch,
    loading: hookLoading,
    createMatch
  } = useMatching();
  
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [localMatches, setLocalMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Fetch matches directly using Supabase to ensure we have fresh results
  useEffect(() => {
    if (user && profile) {
      fetchPotentialMatches();
    }
  }, [user, profile, selectedTab]);
  
  const fetchPotentialMatches = async () => {
    try {
      setIsLoading(true);
      
      // Get matches that already exist
      const { data: existingMatches, error: matchesError } = await supabase
        .from('matches')
        .select('user1_id, user2_id, status')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      
      if (matchesError) throw matchesError;
      
      // Create a set of user IDs that are already matched (accepted or pending)
      const matchedUserIds = new Set<string>();
      existingMatches?.forEach(match => {
        if (['accepted', 'pending'].includes(match.status)) {
          if (match.user1_id === user.id) {
            matchedUserIds.add(match.user2_id);
          } else if (match.user2_id === user.id) {
            matchedUserIds.add(match.user1_id);
          }
        }
      });
      
      // Use fallback logic for fetching profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id, 
          first_name, 
          last_name, 
          nickname,
          interests,
          languages,
          bio,
          student_type,
          university_id,
          campus_id,
          major_id,
          year_of_study,
          avatar_url,
          nationality
        `)
        .neq('id', user.id)
        .eq('campus_id', profile.campus_id) // Make sure to match on same campus
        .limit(50);
      if (profilesError) throw profilesError;
      
      // Filter by student type if needed
      let filteredProfiles = profiles;
      if (selectedTab === "international") {
        filteredProfiles = profiles.filter(p => p.student_type === 'international');
      } else if (selectedTab === "local") {
        filteredProfiles = profiles.filter(p => p.student_type === 'local');
      }
      
      // Filter out users that are already matched/rejected
      filteredProfiles = filteredProfiles.filter(p => !matchedUserIds.has(p.id));
      
      // Calculate match scores
      const matchesWithScores = filteredProfiles.map((potentialMatch) => {
        let score = 0.5;
        
        // Bonus for shared interests
        if (potentialMatch.interests && profile.interests) {
          const userInterests = new Set(profile.interests);
          const matchInterests = new Set(potentialMatch.interests);
          const intersection = [...userInterests].filter(i => matchInterests.has(i));
          score += Math.min(0.3, intersection.length * 0.05); // Up to 30% for interests
        }
        
        // Bonus for shared languages
        if (potentialMatch.languages && profile.languages) {
          // Add type guards to avoid 'never' type error
          const userLanguages = Array.isArray(profile.languages)
            ? profile.languages.map(l => {
                if (typeof l === 'string') return l;
                if (l && typeof l === 'object' && 'id' in l) return (l as { id: string }).id;
                return '';
              })
            : [];
          const matchLanguages = Array.isArray(potentialMatch.languages)
            ? potentialMatch.languages.map(l => {
                if (typeof l === 'string') return l;
                if (l && typeof l === 'object' && 'id' in l) return (l as { id: string }).id;
                return '';
              })
            : [];
          const intersection = userLanguages.filter(l => matchLanguages.includes(l));
          score += Math.min(0.2, intersection.length * 0.05);
        }
        
        // Bonus for diversity (international-local pairing)
        if (potentialMatch.student_type !== profile.student_type) {
          score += 0.1; // 10% bonus for diversity
        }
        
        return {
          ...potentialMatch,
          match_score: Math.min(0.95, score)
        };
      });
      
      // Sort by match score
      const sortedMatches = matchesWithScores.sort((a, b) => b.match_score - a.match_score);
      setLocalMatches(sortedMatches);
      // Proactive UX: If no matches, show a friendly message
      if (sortedMatches.length === 0) {
        toast.info('No more potential matches at this time. Check back later!');
      }
    } catch (err) {
      console.error('Error fetching potential matches:', err);
      toast.error('Failed to load potential matches');
      setLocalMatches([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter matches by selected tab
  const filteredMatches = () => {
    if (!localMatches) return [];
    return localMatches;
  };
  
  // Get the current match to display
  const currentMatch = filteredMatches()[currentMatchIndex];
  
  // Check if the current match is already pending (request sent)
  const isPendingRequest = currentMatch && currentMatch.match_status === 'pending';
  
  // Handle accepting a match
  const handleAccept = async () => {
    if (!currentMatch) return;
    try {
      // Pass the user ID to acceptMatch (not match ID)
      await hookAcceptMatch(currentMatch.id); // currentMatch.id is the user ID
      // Mark as pending in local state
      setLocalMatches((prev) => prev.map(m => m.id === currentMatch.id ? { ...m, match_status: 'pending' } : m));
      // Move to next match if possible
      if (currentMatchIndex < filteredMatches().length - 1) {
        setCurrentMatchIndex(currentMatchIndex + 1);
      } else if (filteredMatches().length > 0) {
        setCurrentMatchIndex(0);
        toast.info("You've seen all potential matches! Starting over...");
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      toast.error('Failed to like profile');
    }
  };
  
  // Handle rejecting a match
  const handleReject = async () => {
    if (!currentMatch) return;
    
    try {
      await hookRejectMatch(currentMatch.id);
      
      // Remove from local matches
      setLocalMatches(localMatches.filter(m => m.id !== currentMatch.id));
      
      // Stay at the same index unless it's the last match
      if (currentMatchIndex >= localMatches.length - 1) {
        setCurrentMatchIndex(Math.max(0, localMatches.length - 2));
      }
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast.error('Failed to skip profile');
    }
  };
  
  // Handle messaging a match
  const handleMessageClick = (userId: string) => {
    navigate(`/messages?user=${userId}`);
  };
  
  // Refresh matches
  const handleRefreshMatches = () => {
    fetchPotentialMatches();
    setCurrentMatchIndex(0);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container max-w-screen-xl mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-3/4">
          <Card className="shadow-md border-t-4 border-t-blue-500">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl flex items-center">
                    <HeartHandshake className="mr-2 h-6 w-6 text-blue-600" />
                    Smart Matching
                  </CardTitle>
                  <CardDescription>
                    Find your perfect campus companions with our smart matching algorithm
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshMatches}
                    className="flex items-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPreferences(true)}
                    className="flex items-center"
                  >
                    <Sliders className="mr-2 h-4 w-4" />
                    Preferences
                  </Button>
                </div>
              </div>
              
              <Tabs 
                value={selectedTab} 
                onValueChange={(value) => {
                  setSelectedTab(value);
                  setCurrentMatchIndex(0);
                }}
                className="mt-4"
              >
                <TabsList className="w-full md:w-auto grid grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="international" className="flex items-center">
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-0 mr-2">Int'l</Badge>
                    International
                  </TabsTrigger>
                  <TabsTrigger value="local" className="flex items-center">
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-0 mr-2">Local</Badge>
                    Local Students
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                    <p className="text-sm text-muted-foreground mt-4">Finding your matches...</p>
                  </div>
                </div>
              ) : filteredMatches().length > 0 ? (
                <div className="flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentMatch?.id || 'empty'}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-md mx-auto"
                    >
                      {currentMatch && (
                        <div className="flex flex-col items-center">
                          <GlobalMatchCard 
                            userId={currentMatch.id}
                            match_score={currentMatch.match_score || 0.5}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onMessage={handleMessageClick}
                            extraActions={currentMatch.match_status === 'pending' && (
                              <span className="text-xs text-amber-600 font-semibold ml-2">Request Sent</span>
                            )}
                          />
                          <div className="flex gap-4 mt-6">
                            <Button 
                              variant="outline" 
                              size="lg"
                              onClick={handleReject}
                              className="flex items-center px-6"
                            >
                              <UserMinus className="mr-2 h-5 w-5 text-gray-500" />
                              Skip
                            </Button>
                            <Button 
                              size="lg"
                              onClick={handleAccept}
                              className="flex items-center bg-green-600 hover:bg-green-700 px-6"
                              disabled={currentMatch.match_status === 'pending'}
                            >
                              <UserPlus className="mr-2 h-5 w-5" />
                              {currentMatch.match_status === 'pending' ? 'Request Sent' : 'Match'}
                            </Button>
                          </div>
                          <div className="mt-6">
                            <p className="text-sm text-center text-muted-foreground">
                              Match {currentMatchIndex + 1} of {filteredMatches().length}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <Search className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="mt-6 text-lg font-medium">No matches found</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    We couldn't find any matches for you right now. Try refining your preferences or check back later.
                  </p>
                  <div className="mt-6">
                    <Button 
                      onClick={handleRefreshMatches}
                      className="flex items-center"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Matches
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-1/4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Your Matches</CardTitle>
              <CardDescription>Recent connections and chats</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    View your matches in the Matches page
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/matches')}
                  >
                    Go to Matches
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {showPreferences && (
            <Card className="shadow-md mt-6 overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg flex items-center">
                  <Sliders className="mr-2 h-4 w-4" />
                  Match Preferences
                </CardTitle>
                <CardDescription>Adjust what matters to you</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <MatchingPreferences 
                  isOpen={showPreferences}
                  onClose={() => setShowPreferences(false)}
                  onSave={() => setShowPreferences(false)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SmartMatchingPage; 
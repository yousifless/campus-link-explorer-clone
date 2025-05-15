import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  UserPlus, 
  Info, 
  Languages, 
  Heart,
  User,
  UserMinus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MatchUser {
  id: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  student_type?: string;
  university?: string;
  major?: string;
  year_of_study?: number;
  interests?: any[];
  languages?: any[];
  cultural_insight?: string;
  location?: string;
  match_score?: number;
  nationality?: string;
  [key: string]: any;
}

interface GlobalMatchCardProps {
  userId: string; // ID of the other user
  matchId?: string; // ID of the match (if available)
  match_score?: number; // Match score (if already calculated)
  isMatched?: boolean; // Whether users are already matched
  onAccept?: (userId: string) => Promise<void>;
  onReject?: (userId: string) => Promise<void>;
  onMessage?: (userId: string) => void;
  onUnmatch?: (matchId: string) => Promise<void> | void; // Allow both Promise<void> and void return types
  hybridMatch?: boolean;
  extraActions?: React.ReactNode;
  showActions?: boolean; // Whether to show action buttons
}

export const GlobalMatchCard = ({
  userId,
  matchId,
  match_score,
  isMatched = false,
  onAccept,
  onReject,
  onMessage,
  onUnmatch,
  hybridMatch = false,
  extraActions,
  showActions = true
}: GlobalMatchCardProps) => {
  const [user, setUser] = useState<MatchUser | null>(null);
  const [formattedLanguages, setFormattedLanguages] = useState<any[]>([]);
  const [formattedInterests, setFormattedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchPercentage, setMatchPercentage] = useState<number>(match_score || 0);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Function to load user's data
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // Try fetching with enhanced error handling
        try {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (!userError) {
            // Successfully fetched the profile
            setUser(userData);
            
            // Continue with additional data (languages, interests, etc.)
            await loadAdditionalData(userData);
            return;
          }
        } catch (initialError) {
          console.error('Initial profile fetch error:', initialError);
          // Continue to fallback approach
        }
        
        // Fallback approach: Try a more targeted query with fewer fields
        try {
          const { data: basicUserData, error: basicUserError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, bio, student_type')
            .eq('id', userId)
            .single();
          
          if (!basicUserError && basicUserData) {
            setUser(basicUserData);
            setFormattedLanguages([]);
            setFormattedInterests([]);
            setMatchPercentage(match_score || 75);
            return;
          }
        } catch (basicError) {
          console.error('Basic profile fetch error:', basicError);
          // Continue to final fallback
        }
        
        // Final fallback: Create a placeholder profile
        console.warn(`Creating placeholder profile for user ${userId}`);
        setUser({
          id: userId,
          first_name: 'User',
          last_name: '',
          avatar_url: null,
          bio: 'Profile data unavailable',
          student_type: 'unknown'
        });
        setFormattedLanguages([]);
        setFormattedInterests([]);
        setMatchPercentage(match_score || 75);
        
      } catch (error) {
        console.error('Error loading user data:', error);
        // Create a fallback user with minimal data
        setUser({
          id: userId,
          first_name: 'User',
          last_name: '',
          avatar_url: null,
          bio: 'Profile data unavailable',
          student_type: 'unknown'
        });
        setFormattedLanguages([]);
        setFormattedInterests([]);
        setMatchPercentage(match_score || 75);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to load additional profile data
    const loadAdditionalData = async (userData: any) => {
      try {
        // Get university and major data separately to avoid relationship issues
        let universityName = null;
        let majorName = null;
        
        if (userData.university_id) {
          const { data: universityData } = await supabase
            .from('universities')
            .select('name')
            .eq('id', userData.university_id)
            .single();
            
          if (universityData) {
            universityName = universityData.name;
          }
        }
        
        if (userData.major_id) {
          const { data: majorData } = await supabase
            .from('majors')
            .select('name')
            .eq('id', userData.major_id)
            .single();
            
          if (majorData) {
            majorName = majorData.name;
          }
        }
        
        // Get user data with relationships
        const userWithRels = {
          ...userData,
          university: universityName || userData.university_id,
          major: majorName || userData.major_id,
        };
        
        setUser(userWithRels);
        
        // Try to fetch languages with error handling
        try {
          const { data: userLanguages, error: langError } = await supabase
            .from('user_languages')
            .select('*, language:languages(*)')
            .eq('user_id', userId);
            
          if (!langError && userLanguages) {
            // Process languages
            const processedLanguages = userLanguages.map(ul => ({
              id: ul.language.id,
              name: ul.language.name,
              proficiency: ul.proficiency
            }));
            
            setFormattedLanguages(processedLanguages);
          } else {
            setFormattedLanguages([]);
          }
        } catch (error) {
          console.error('Error fetching languages:', error);
          setFormattedLanguages([]);
        }
        
        // Try to fetch interests with error handling
        try {
          const { data: userInterests, error: interestError } = await supabase
            .from('user_interests')
            .select('*, interest:interests(*)')
            .eq('user_id', userId);
            
          if (!interestError && userInterests) {
            // Process interests
            const processedInterests = userInterests.map(ui => 
              ui.interest.name
            );
            
            setFormattedInterests(processedInterests);
          } else {
            setFormattedInterests([]);
          }
        } catch (error) {
          console.error('Error fetching interests:', error);
          setFormattedInterests([]);
        }
        
        // Use provided match score or default value
        if (match_score) {
          setMatchPercentage(match_score);
        } else {
          setMatchPercentage(75); // Default fallback if no score calculation
        }
      } catch (error) {
        console.error('Error loading additional data:', error);
        // Keep the basic user data but empty interests/languages
        setFormattedLanguages([]);
        setFormattedInterests([]);
        setMatchPercentage(match_score || 75);
      }
    };

    loadUserData();
  }, [userId, matchId, match_score, currentUser]);

  if (loading || !user) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-xl h-[240px] w-full max-w-xs mx-auto"></div>
    );
  }

  // Create initials for avatar fallback
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  
  // Student type determines the card color scheme
  const isInternational = user.student_type === 'international';
  
  const handleMessage = () => {
    if (onMessage) {
      onMessage(userId);
    }
  };

  const handleAccept = async () => {
    if (onAccept) {
      await onAccept(userId);
    }
  };

  const handleReject = async () => {
    if (onReject) {
      await onReject(userId);
    }
  };
  
  const handleUnmatch = async () => {
    if (onUnmatch && matchId) {
      await onUnmatch(matchId);
    }
  };
  
  const matchBadgeColor = 
    hybridMatch ? "text-purple-700 bg-purple-100" :
    matchPercentage >= 85 ? "text-green-700 bg-green-100" : 
    matchPercentage >= 65 ? "text-blue-700 bg-blue-100" : 
    "text-amber-700 bg-amber-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
    >
      <div className="max-w-xs mx-auto rounded-xl shadow bg-white overflow-hidden relative border border-gray-100" style={{ maxWidth: '280px' }}>
        {/* Header with gradient */}
        <div className="h-14 bg-gradient-to-r from-blue-500 to-purple-500 relative">
          {/* Profile image */}
          <div className="absolute -bottom-6 left-3 z-10">
            <Avatar className="h-10 w-10 border border-white shadow">
              <AvatarImage src={user.avatar_url || ''} alt={`${user.first_name} ${user.last_name}`} />
              <AvatarFallback className="bg-gray-200 text-gray-700 text-base font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Student type label */}
          <div className="absolute top-1 right-1 bg-blue-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
            {isInternational ? 'International' : 'Local'}
          </div>
        </div>
        
        {/* Card body */}
        <div className="pt-7 pb-3 px-3 relative">
          {/* Match percentage circle */}
          <div className="absolute top-1 right-1 flex flex-col items-center">
            <div className={cn(
              "rounded-full border border-gray-200 bg-white shadow w-9 h-9 flex flex-col items-center justify-center",
              hybridMatch && "ring-1 ring-purple-300"
            )}>
              <span className={cn(
                "text-xs font-bold",
                hybridMatch ? "text-purple-700" : "text-blue-700"
              )}>
                {Math.round(matchPercentage)}%
              </span>
              <span className="text-[9px] text-gray-500 leading-none">Match</span>
            </div>
          </div>
          
          {/* Profile details */}
          <div className="pl-14">
            <div className="text-base font-semibold text-gray-900 leading-tight">
              {user.first_name} {user.last_name}
              {user.nickname && (
                <span className="ml-1 text-sm text-gray-500 font-normal">({user.nickname})</span>
              )}
            </div>
            <div className="text-gray-700 text-xs mt-0.5">{user.university || 'University not specified'}</div>
            <div className="text-gray-500 text-xs">{user.major || 'Major not specified'}</div>
            {user.year_of_study && (
              <div className="text-gray-400 text-[10px]">Year: {user.year_of_study}</div>
            )}
          </div>
          
          {/* Bio/description */}
          <div className="mt-1 pl-0 md:pl-14">
            <p className="text-gray-700 text-xs line-clamp-2">{user.bio || 'No bio provided.'}</p>
          </div>
          
          {/* Cultural insight if available */}
          {user.cultural_insight && (
            <div className="mt-0.5 pl-0 md:pl-14">
              <span className="text-[10px] text-amber-700 font-semibold">Cultural:</span>
              <span className="ml-1 text-[10px] text-gray-700">{user.cultural_insight}</span>
            </div>
          )}
          
          {/* Location if available */}
          {user.location && (
            <div className="mt-0.5 pl-0 md:pl-14">
              <span className="text-[10px] text-blue-700 font-semibold">Location:</span>
              <span className="ml-1 text-[10px] text-gray-700">{user.location}</span>
            </div>
          )}
          
          {/* Languages */}
          <div className="mt-1 flex flex-wrap gap-0.5 pl-0 md:pl-14">
            {formattedLanguages.length > 0 ? formattedLanguages.map((lang, idx) => (
              <span key={idx} className="bg-white border border-blue-200 text-blue-900 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                {lang.name}
              </span>
            )) : <span className="text-[10px] text-gray-400">No languages</span>}
          </div>
          
          {/* Interests/tags */}
          <div className="mt-0.5 flex flex-wrap gap-0.5 pl-0 md:pl-14">
            {formattedInterests.length > 0 ? formattedInterests.slice(0, 4).map((interest, idx) => (
              <span key={idx} className="bg-pink-100 text-pink-700 rounded-full px-1.5 py-0.5 text-[10px] font-medium border border-pink-200">
                {interest}
              </span>
            )) : <span className="text-[10px] text-gray-400">No interests</span>}
            {formattedInterests.length > 4 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="bg-pink-100 text-pink-700 rounded-full px-1.5 py-0.5 text-[10px] font-medium border border-pink-200">
                      +{formattedInterests.length - 4} more
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      {formattedInterests.slice(4).join(', ')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Nationality if available */}
          {user.nationality && (
            <div className="mt-1 pl-0 md:pl-14">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]">
                From: {user.nationality}
              </Badge>
            </div>
          )}
          
          {/* Action buttons if showActions is true */}
          {showActions && (
            <div className="mt-2 flex gap-1 pl-0 md:pl-14">
              {!isMatched ? (
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-full shadow hover:from-blue-600 hover:to-purple-600 text-xs py-0.5 h-7 min-h-0"
                  onClick={handleAccept}
                >
                  <motion.span
                    className="flex items-center"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <UserPlus className="mr-1 h-3.5 w-3.5" /> Connect
                  </motion.span>
                </Button>
              ) : (
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-full shadow hover:from-blue-600 hover:to-purple-600 text-xs py-0.5 h-7 min-h-0"
                  onClick={handleMessage}
                >
                  <motion.span
                    className="flex items-center"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message
                  </motion.span>
                </Button>
              )}
            </div>
          )}
          
          {/* Extra actions if provided */}
          {extraActions && (
            <div className="mt-1 pl-0 md:pl-14">
              {extraActions}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GlobalMatchCard; 
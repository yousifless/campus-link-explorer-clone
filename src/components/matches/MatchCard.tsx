import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  GlobeIcon, 
  BookOpenIcon, 
  LanguagesIcon, 
  HeartIcon, 
  MessageSquareIcon, 
  UserPlusIcon 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Context's MatchType and database's MatchType are different
// So we just use a generic type with required properties
interface MatchTypeWithOtherUser {
  id: string;
  otherUser: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    nationality?: string | null;
    student_type?: string | null;
    year_of_study?: number | null;
    university_id?: string | null;
    major_id?: string | null;
    location?: string | null;
    interests?: string[];
    languages?: any[];
    match_score?: number;
    is_verified?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

interface University { id: string; name: string; }
interface Major { id: string; name: string; }
interface Language { id: string; name: string; }
interface Interest { id: string; name: string; }

interface MatchCardProps {
  match: MatchTypeWithOtherUser;
  isMatched: boolean;
  onAccept: (matchId: string) => Promise<void>;
  onReject: (matchId: string) => Promise<void>;
  onMessage?: (matchId: string) => void;
  hybridMatch?: boolean;
  extraActions?: React.ReactNode;
}

interface LegacyMatchCardProps {
  profile: any; // Full user profile object
  universities?: University[];
  majors?: Major[];
  languages?: Language[];
  interests?: Interest[];
  isPending?: boolean;
  onAccept?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onMessage?: () => void;
  matchPercentage?: number;
  hybridMatch?: boolean;
  extraActions?: React.ReactNode;
}

interface MotionComponentProps {
  children: React.ReactNode;
  [key: string]: any;
}

// Create motion components
const MotionCard = motion.div;
const MotionButton = motion.button;

// New MatchCard component that wraps the legacy MatchCard
const MatchCard = ({
  match,
  isMatched,
  onAccept,
  onReject,
  onMessage,
  hybridMatch = false,
  extraActions
}: MatchCardProps) => {
  const profile = match.otherUser;
  const matchPercentage = profile.match_score !== undefined ? profile.match_score : 75; // Default to 75% if no score
  
  // Handle actions with the match ID
  const handleAccept = () => onAccept(match.id);
  const handleReject = () => onReject(match.id);
  const handleMessage = () => onMessage && onMessage(match.id);
  
  return (
    <MatchCardBase
      profile={profile}
      isPending={!isMatched}
      matchPercentage={matchPercentage}
      onAccept={handleAccept}
      onReject={handleReject}
      onMessage={handleMessage}
      hybridMatch={hybridMatch}
      extraActions={extraActions}
    />
  );
};

// Legacy component, now used internally
const MatchCardBase = ({
  profile,
  universities = [],
  majors = [],
  languages = [],
  interests = [],
  isPending = false,
  onAccept,
  onReject,
  onMessage,
  matchPercentage = 75, // Default to 75% if no score provided
  hybridMatch = false,
  extraActions
}: LegacyMatchCardProps) => {
  // Always call hooks at the top level
  const navigate = useNavigate();

  // Early return with null, but after hooks
  if (!profile) {
    return null;
  }

  const handleMessage = () => {
    if (onMessage) {
      onMessage();
    }
  };

  // Map university, major, and campus IDs to names
  const universityObj = universities.find(u => u.id === profile.university_id);
  const majorObj = majors.find(m => m.id === profile.major_id);
  // If you have campuses, you can add a similar lookup
  // const campusObj = campuses?.find(c => c.id === profile.campus_id);

  // Get language names - simplified
  const userLanguages = (Array.isArray(profile.languages) ? profile.languages : []);

  // Get interest names - simplified
  const userInterests = (Array.isArray(profile.interests) ? profile.interests : []);

  // Format languages for display
  const formattedLanguages = userLanguages.map(lang => {
    // Handle different language object formats
    if (typeof lang === 'string') {
      return { id: lang, name: lang };
    } else if (typeof lang === 'object') {
      if (lang.name) {
        return { id: lang.id || lang.name, name: lang.name, proficiency: lang.proficiency };
      } else if (lang.id) {
        return { id: lang.id, name: lang.id };
      }
    }
    return { id: String(lang), name: String(lang) };
  });

  // Format interests for display
  const formattedInterests = userInterests.map(interest => {
    // Handle different interest object formats
    if (typeof interest === 'string') {
      return interest;
    } else if (typeof interest === 'object') {
      return interest.name || interest.id || String(interest);
    }
    return String(interest);
    });

  // Student type determines the card color scheme
  const isInternational = profile.student_type === 'international';
  const cardColors = isInternational 
    ? "from-pink-400 to-pink-500" 
    : "from-indigo-500 to-indigo-600";
  
  const matchBadgeColor = 
    hybridMatch ? "text-purple-700 bg-purple-100" :
    matchPercentage >= 85 ? "text-green-700 bg-green-100" : 
    matchPercentage >= 65 ? "text-blue-700 bg-blue-100" : 
    "text-amber-700 bg-amber-100";

  // Create initials for avatar fallback
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
    >
      {/* Card container: reduced width, tighter border radius, shadow */}
      <div className="max-w-xs mx-auto rounded-xl shadow bg-white overflow-hidden relative border border-gray-100" style={{ maxWidth: '280px' }}>
        {/* Header with gradient, reduced height */}
        <div className="h-14 bg-gradient-to-r from-blue-500 to-purple-500 relative">
          {/* Smaller profile image, aligned with card body */}
          <div className="absolute -bottom-6 left-3 z-10">
            <Avatar className="h-10 w-10 border border-white shadow">
              <AvatarImage src={profile.avatar_url || ''} alt={`${profile.first_name} ${profile.last_name}`} />
              <AvatarFallback className="bg-gray-200 text-gray-700 text-base font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Student type label, smaller and closer to edge */}
          <div className="absolute top-1 right-1 bg-blue-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
            {isInternational ? 'International' : 'Local'}
          </div>
        </div>
        {/* Card body: tighter padding */}
        <div className="pt-7 pb-3 px-3 relative">
          {/* Match percentage circle, smaller */}
          <div className="absolute top-1 right-1 flex flex-col items-center">
            <div className={`rounded-full border border-gray-200 bg-white shadow w-9 h-9 flex flex-col items-center justify-center ${hybridMatch ? 'ring-1 ring-purple-300' : ''}`}>
              <span className={`text-xs font-bold ${hybridMatch ? 'text-purple-700' : 'text-blue-700'}`}>{Math.round(matchPercentage)}%</span>
              <span className="text-[9px] text-gray-500 leading-none">Match</span>
            </div>
          </div>
          {/* Profile details: left-aligned, compact */}
          <div className="pl-14">
            <div className="text-base font-semibold text-gray-900 leading-tight">
              {profile.first_name} {profile.last_name}
              {profile.nickname && (
                <span className="ml-1 text-sm text-gray-500 font-normal">({profile.nickname})</span>
              )}
            </div>
            <div className="text-gray-700 text-xs mt-0.5">{universityObj?.name || profile.university || 'University not specified'}</div>
            <div className="text-gray-500 text-xs">{majorObj?.name || profile.major || 'Major not specified'}</div>
            {profile.year_of_study && (
              <div className="text-gray-400 text-[10px]">Year: {profile.year_of_study}</div>
            )}
          </div>
          {/* Bio/description: compact, left-aligned */}
          <div className="mt-1 pl-0 md:pl-14">
            <p className="text-gray-700 text-xs line-clamp-2">{profile.bio || 'No bio provided.'}</p>
          </div>
          {/* Cultural insight */}
          {profile.cultural_insight && (
            <div className="mt-0.5 pl-0 md:pl-14">
              <span className="text-[10px] text-amber-700 font-semibold">Cultural:</span>
              <span className="ml-1 text-[10px] text-gray-700">{profile.cultural_insight}</span>
            </div>
          )}
          {/* Location */}
          {profile.location && (
            <div className="mt-0.5 pl-0 md:pl-14">
              <span className="text-[10px] text-blue-700 font-semibold">Location:</span>
              <span className="ml-1 text-[10px] text-gray-700">{profile.location}</span>
            </div>
          )}
          {/* Languages: compact tags */}
          <div className="mt-1 flex flex-wrap gap-0.5 pl-0 md:pl-14">
            {formattedLanguages.length > 0 ? formattedLanguages.map((lang: any, idx: number) => (
              <span key={idx} className="bg-white border border-blue-200 text-blue-900 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                {lang.id || lang.name}
              </span>
            )) : <span className="text-[10px] text-gray-400">No languages</span>}
          </div>
          {/* Interests/tags: compact tags */}
          <div className="mt-0.5 flex flex-wrap gap-0.5 pl-0 md:pl-14">
            {formattedInterests.length > 0 ? formattedInterests.slice(0, 4).map((interest: string, idx: number) => (
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
          {profile.nationality && (
            <div className="mt-1 pl-0 md:pl-14">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]">
                From: {profile.nationality}
              </Badge>
            </div>
          )}
          {/* Action buttons: compact, horizontally aligned */}
          <div className="mt-2 flex gap-1 pl-0 md:pl-14">
            {isPending ? (
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-full shadow hover:from-blue-600 hover:to-purple-600 text-xs py-0.5 h-7 min-h-0"
                onClick={onAccept}
              >
                <motion.span
                  className="flex items-center"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <UserPlusIcon className="mr-1 h-3.5 w-3.5" /> Connect
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
                  <MessageSquareIcon className="mr-1 h-3.5 w-3.5" /> Message
                </motion.span>
              </Button>
            )}
            {isPending && (
              <Button 
                variant="outline" 
                className="flex-1 border-blue-200 text-blue-700 font-semibold rounded-full shadow bg-white hover:bg-blue-50 text-xs py-0.5 h-7 min-h-0"
                onClick={onReject}
              >
                Skip
              </Button>
            )}
          </div>
          {/* Add extra actions if provided */}
          {extraActions && (
            <div className="mt-1 pl-0 md:pl-14">
              {extraActions}
            </div>
          )}
        </div>
      </div>
    </MotionCard>
  );
};

export default MatchCard;

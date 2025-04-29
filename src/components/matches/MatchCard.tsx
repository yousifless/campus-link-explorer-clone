
import React from 'react';
import { motion } from 'framer-motion';
import { MatchType } from '@/types/database';
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

interface University { id: string; name: string; }
interface Major { id: string; name: string; }
interface Language { id: string; name: string; }
interface Interest { id: string; name: string; }

interface MatchCardProps {
  match: MatchType;
  universities?: University[];
  majors?: Major[];
  languages?: Language[];
  interests?: Interest[];
  isPending?: boolean;
  onAccept?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onMessage?: () => void;
}

const MatchCard = ({
  match,
  universities = [],
  majors = [],
  languages = [],
  interests = [],
  isPending = false,
  onAccept,
  onReject,
  onMessage
}: MatchCardProps) => {
  const navigate = useNavigate();
  const otherUser = match.otherUser;

  const handleMessage = () => {
    if (onMessage) {
      onMessage();
    } else {
      navigate(`/chat/${match.id}`);
    }
  };

  // Map university and major IDs to names
  const universityObj = universities.find(u => u.id === otherUser.university);
  const majorObj = majors.find(m => m.id === otherUser.major);

  // Map language IDs to names (assuming otherUser.languages is an array of { id, proficiency })
  const userLanguages = (Array.isArray((otherUser as any).languages) ? (otherUser as any).languages : []).map((lang: any) => {
    const langObj = languages.find(l => l.id === lang.id);
    return langObj ? { name: langObj.name, proficiency: lang.proficiency } : null;
  }).filter(Boolean);

  // Map interest IDs to names
  const userInterests = (Array.isArray((otherUser as any).interests) ? (otherUser as any).interests : []).map((interestId: string) => {
    const interestObj = interests.find(i => i.id === interestId);
    return interestObj ? interestObj.name : interestId;
  });

  // Student type determines the card color scheme
  const isInternational = otherUser.student_type === 'international';
  const cardColors = isInternational 
    ? "from-pink-400 to-pink-500" 
    : "from-indigo-500 to-indigo-600";
  
  const matchPercentage = (otherUser as any).match_score || 0;
  const matchBadgeColor = 
    matchPercentage >= 85 ? "text-green-700 bg-green-100" : 
    matchPercentage >= 65 ? "text-blue-700 bg-blue-100" : 
    "text-amber-700 bg-amber-100";

  // Create initials for avatar fallback
  const initials = `${otherUser.first_name?.[0] || ''}${otherUser.last_name?.[0] || ''}`.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="rounded-xl overflow-hidden shadow-lg border bg-white hover:shadow-xl transition-all duration-300">
        {/* Header Background */}
        <div className={`h-24 bg-gradient-to-r ${cardColors} relative`}>
          {/* Student type badge */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium text-white bg-white/20 backdrop-blur-sm">
            {isInternational ? 'International Student' : 'Local Student'}
          </div>
          
          {/* Match percentage */}
          <div className="absolute -bottom-6 right-6 bg-white rounded-full h-16 w-16 flex flex-col items-center justify-center shadow-lg border-4 border-white">
            <span className={`text-lg font-bold ${matchBadgeColor.split(' ')[0]}`}>
              {Math.round(matchPercentage)}%
            </span>
            <span className="text-xs text-gray-500">Match</span>
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="px-6 pt-6 pb-4">
          {/* Avatar and Name */}
          <div className="flex mb-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-md -mt-12 mr-4">
              <AvatarImage src={otherUser.avatar_url || ''} alt={`${otherUser.first_name} ${otherUser.last_name}`} />
              <AvatarFallback className="bg-gray-200 text-gray-700 text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold">{otherUser.first_name} {otherUser.last_name}</h3>
              
              <div className="flex items-center text-gray-600 mt-1">
                <BookOpenIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{universityObj?.name || otherUser.university || 'University not specified'}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <GlobeIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{majorObj?.name || otherUser.major || 'Major not specified'}</span>
              </div>
            </div>
          </div>
          
          {/* Bio */}
          {otherUser.bio && (
            <div className="mb-4">
              <p className="text-gray-700 text-sm line-clamp-3">{otherUser.bio}</p>
            </div>
          )}
          
          {/* Languages */}
          {userLanguages.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <LanguagesIcon className="h-4 w-4 mr-1 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Languages</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {userLanguages.map((lang: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                    {lang.name} {lang.proficiency && <span className="opacity-70">({lang.proficiency})</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Interests */}
          {userInterests.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-1">
                <HeartIcon className="h-4 w-4 mr-1 text-pink-600" />
                <span className="text-sm font-medium text-gray-700">Interests</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {userInterests.slice(0, 5).map((interest: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="bg-pink-50 text-pink-700 border-pink-100">
                    {interest}
                  </Badge>
                ))}
                {userInterests.length > 5 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-100">
                          +{userInterests.length - 5} more
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          {userInterests.slice(5).join(', ')}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
          
          {/* Nationality if available */}
          {otherUser.nationality && (
            <div className="mb-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                From: {otherUser.nationality}
              </Badge>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex mt-4 gap-3">
            {isPending ? (
              <Button 
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                onClick={onAccept}
              >
                <motion.div
                  className="flex items-center"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <UserPlusIcon className="mr-2 h-4 w-4" /> Connect
                </motion.div>
              </Button>
            ) : (
              <Button 
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                onClick={handleMessage}
              >
                <motion.div
                  className="flex items-center"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <MessageSquareIcon className="mr-2 h-4 w-4" /> Message
                </motion.div>
              </Button>
            )}
            
            {isPending && (
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 hover:bg-gray-50"
                onClick={onReject}
              >
                Skip
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchCard;

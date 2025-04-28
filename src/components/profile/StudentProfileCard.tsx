import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ProfileType } from '@/types/database';
import { MessageSquare, UserPlus, Globe, School, BookOpen, Calendar, MapPin, Languages, Heart, Award, User } from 'lucide-react';

interface StudentProfileCardProps {
  profile: ProfileType;
  matchScore?: number;
  onConnect?: () => void;
  onMessage?: () => void;
  variant?: 'purple' | 'pink';
}

const StudentProfileCard = ({ 
  profile, 
  matchScore, 
  onConnect, 
  onMessage,
  variant = 'purple' 
}: StudentProfileCardProps) => {
  const getBadgeVariant = (percent: number) => {
    if (percent > 85) return "default";
    if (percent > 65) return "secondary";
    return "destructive";
  };

  // Header color
  const headerBg = variant === 'purple' ? 'bg-purple-500' : 'bg-pink-400';
  const badgeBg = variant === 'purple' ? 'bg-purple-600 text-white' : 'bg-pink-500 text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      <Card className="overflow-hidden shadow-md border-0">
        {/* Header with avatar, name, badges, and match percent */}
        <div className={cn('relative h-24', headerBg)}>
          {/* Student type badge */}
          <span className={cn('absolute top-4 right-4 rounded-full px-4 py-1 text-sm font-medium shadow', badgeBg)}>
            {profile.student_type === 'international' ? 'International Student' : 'Local Student'}
          </span>
          {/* Match percent badge */}
          {typeof matchScore === 'number' && (
            <span className="absolute top-16 right-4 bg-white shadow rounded-full px-4 py-2 text-purple-700 font-bold text-lg flex flex-col items-center border-2 border-purple-200" style={{ transform: 'translateY(-50%)' }}>
              {Math.round(matchScore)}%<span className="text-xs font-normal text-gray-500">Match</span>
            </span>
          )}
          {/* Avatar */}
          <div className="absolute left-6 top-12 transform -translate-y-1/2">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.first_name} />
              <AvatarFallback>
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        {/* Main content */}
        <CardContent className="pt-12 pb-4 px-6">
          {/* Name, university, major */}
          <div className="pl-28">
            <CardTitle className="text-2xl font-bold mb-1">
              {profile.first_name} {profile.last_name}
            </CardTitle>
            {profile.university?.name && (
              <div className="text-base text-gray-700 font-medium leading-tight">{profile.university.name}</div>
            )}
            {profile.major_id && (
              <div className="text-base text-gray-500 leading-tight mb-2">{profile.major_id}</div>
            )}
            {/* Bio */}
            {profile.bio && (
              <div className="text-gray-700 text-sm mt-2 mb-2 line-clamp-3">{profile.bio}</div>
            )}
            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.languages.map((lang, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-900 rounded-full px-3 py-1 text-xs font-semibold">
                    {lang.id}{lang.proficiency ? ` (${lang.proficiency})` : ''}
                  </span>
                ))}
              </div>
            )}
            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.interests.map((interest, idx) => (
                  <span key={idx} className="bg-pink-100 text-pink-700 rounded-full px-3 py-1 text-xs font-semibold">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 mt-6 pl-28">
            {onConnect && (
              <Button 
                size="lg" 
                variant="default"
                onClick={onConnect}
                className={cn('flex-1', badgeBg, 'text-white')}
              >
                <UserPlus className="mr-1 h-4 w-4" /> Connect
              </Button>
            )}
            {onMessage && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={onMessage}
                className="flex-1 border-gray-300"
              >
                <MessageSquare className="mr-1 h-4 w-4" /> Message
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StudentProfileCard; 
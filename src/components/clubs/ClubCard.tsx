import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, Book, Lock, UnlockIcon, Share2, Star, Sparkles } from 'lucide-react';
import { Club } from '@/types/clubs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ClubCardProps {
  club: Club;
  onJoin?: (clubId: string) => Promise<void>;
  onView?: (clubId: string) => void;
  onShare?: () => void;
  userIsMember?: boolean;
}

export const ClubCard = ({ 
  club, 
  onJoin, 
  onView,
  onShare,
  userIsMember = false
}: ClubCardProps) => {
  const { 
    id,
    name,
    description,
    tags,
    course_code,
    visibility,
    creator_first_name,
    creator_last_name,
    creator_avatar_url,
    member_count,
    upcoming_meetups_count,
    logo_url,
    banner_url,
    banner_signed_url
  } = club;

  // State for the logo URL that might come from localStorage
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(logo_url);
  // State for favorite (local only for now)
  const [isFavorite, setIsFavorite] = useState(false);
  // Example: featured if club has > 100 members (for demo)
  const isFeatured = (member_count || 0) > 100;
  // Banner image fallback
  const banner = banner_url || banner_signed_url || '/default-banner.jpg';

  // Check localStorage for club logo on mount
  useEffect(() => {
    // If no logo_url is provided, try to get it from localStorage
    if (!logo_url) {
      const storedLogo = localStorage.getItem(`club_${id}_logo`);
      if (storedLogo) {
        setLogoUrl(storedLogo);
      }
    }
  }, [id, logo_url]);

  // Create a meaningful avatar fallback from the club name
  const fallbackInitial = name.charAt(0).toUpperCase();
  
  // Format tags for display
  const displayTags = tags?.slice(0, 3) || [];
  const hasMoreTags = tags?.length > 3;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.045, boxShadow: '0 16px 48px rgba(80,80,180,0.18)' }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl bg-white shadow-lg hover:shadow-2xl border border-blue-200 overflow-hidden group cursor-pointer transition-all flex flex-col"
      tabIndex={0}
      aria-label={`View details for club: ${name}`}
    >
      {/* Banner image */}
      <div className="relative h-28 w-full overflow-hidden">
        <img
          src={banner}
          alt={name + ' banner'}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {isFeatured && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-pink-400 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow">
            <Sparkles className="h-4 w-4" /> Featured
          </span>
        )}
        <button
          className="absolute top-2 right-2 bg-white/80 rounded-full p-1 shadow hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          aria-label={isFavorite ? 'Unfavorite club' : 'Favorite club'}
          onClick={e => { e.stopPropagation(); setIsFavorite(f => !f); }}
        >
          <Star className={isFavorite ? 'text-yellow-400 fill-yellow-300' : 'text-gray-400'} />
        </button>
      </div>
      <CardHeader className="pb-2 pt-3 flex flex-row items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-white shadow -mt-10 bg-white">
          <AvatarImage src={logoUrl || creator_avatar_url || ''} alt={name} />
          <AvatarFallback className="bg-blue-50 text-blue-700">
            {fallbackInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xl font-extrabold text-blue-900 group-hover:text-indigo-700 truncate">
            {name}
          </CardTitle>
          <CardDescription className="text-xs text-blue-700/80 mt-1 truncate">
            Created by {creator_first_name} {creator_last_name}
          </CardDescription>
        </div>
        <Badge variant={visibility === 'private' ? 'outline' : 'secondary'} className="flex items-center text-xs">
          {visibility === 'private' ? (
            <><Lock className="h-3 w-3 mr-1" />Private</>
          ) : (
            <><UnlockIcon className="h-3 w-3 mr-1" />Public</>
          )}
        </Badge>
      </CardHeader>
      <CardContent className="pb-3 pt-1">
        <p className="text-sm text-gray-500 line-clamp-2 min-h-[36px] font-medium">
          {description || 'No description provided'}
        </p>
        {course_code && (
          <div className="flex items-center mt-2 text-xs text-blue-600">
            <Book className="h-3 w-3 mr-1" />
            Course: {course_code}
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-3">
          {displayTags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs py-0 px-2 bg-gradient-to-r from-blue-200 to-pink-200 text-blue-800 border-none">
              {tag}
            </Badge>
          ))}
          {hasMoreTags && (
            <Badge variant="secondary" className="text-xs py-0 px-2 bg-blue-100 text-blue-700 border-none">
              +{tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0 pb-3 text-xs text-blue-700 border-t border-blue-100 bg-blue-50">
        <div className="flex items-center gap-1" title="Members">
          <Users className="h-3 w-3 mr-1" />
          {member_count || 0}
        </div>
        <div className="flex items-center gap-1" title="Upcoming meetups">
          <Calendar className="h-3 w-3 mr-1" />
          {upcoming_meetups_count || 0}
        </div>
      </CardFooter>
      <div className="p-3 pt-0 flex gap-2 border-t border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-all"
          onClick={() => onView?.(id)}
        >
          View Details
        </Button>
        {!userIsMember && onJoin && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full font-semibold group-hover:border-indigo-400 group-hover:text-indigo-700 transition-all"
            onClick={() => onJoin(id)}
          >
            Join Club
          </Button>
        )}
        {onShare && (
          <Button
            variant="outline"
            size="sm"
            className="flex-none w-10 group-hover:border-indigo-400 group-hover:text-indigo-700 transition-all"
            onClick={onShare}
            aria-label="Share club"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ClubCard; 
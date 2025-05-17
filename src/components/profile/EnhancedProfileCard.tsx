
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Share2, User, Globe, Bookmark, BadgeCheck, MapPin, School, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  profile: any;
  variant?: 'compact' | 'full';
  onConnect?: () => void;
  onMessage?: () => void;
}

export function EnhancedProfileCard({ profile, variant = 'full', onConnect, onMessage }: ProfileCardProps) {
  if (!profile) return null;
  
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`;
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      y: -5,
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    }
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.05 * i,
        duration: 0.4,
        ease: 'easeOut'
      }
    })
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="w-full h-full"
    >
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white via-white to-blue-50 h-full relative">
        {/* Card Header with Gradient Banner */}
        <div className={`h-32 w-full ${profile.student_type === 'international' 
          ? 'bg-gradient-to-r from-pink-400 to-purple-500' 
          : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
        >
          {/* Decorative SVG patterns */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="#fff" />
              </pattern>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern)" />
            </svg>
          </div>
          
          {/* Student type badge */}
          <div className="absolute top-4 right-4">
            <Badge className={`px-3 py-1.5 text-xs font-medium ${
              profile.student_type === 'international' 
                ? 'bg-pink-100 text-pink-800 border border-pink-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {profile.student_type === 'international' ? 'International Student' : 'Local Student'}
            </Badge>
          </div>
        </div>
        
        {/* Avatar */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage 
                src={profile.avatar_url || ''} 
                alt={fullName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-white">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="pt-14 pb-4 px-6 flex flex-col items-center">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>
            {profile.nickname && (
              <p className="text-sm text-gray-500 italic">"{profile.nickname}"</p>
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-3">
            {profile.university_id && (
              <div className="flex items-center text-sm text-gray-600">
                <School className="h-4 w-4 mr-1 text-indigo-500" />
                <span className="truncate max-w-[150px]">{profile.university_id}</span>
              </div>
            )}
            
            {profile.major_id && (
              <div className="flex items-center text-sm text-gray-600">
                <BookOpen className="h-4 w-4 mr-1 text-purple-500" />
                <span className="truncate max-w-[150px]">{profile.major_id}</span>
              </div>
            )}
          </div>
          
          {profile.nationality && (
            <div className="flex items-center mb-3 text-sm text-gray-600">
              <Globe className="h-4 w-4 mr-1 text-blue-500" />
              <span>{profile.nationality}</span>
            </div>
          )}
          
          {variant === 'full' && profile.bio && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 w-full">
              <p className="text-sm text-gray-700 line-clamp-3">{profile.bio}</p>
            </div>
          )}
          
          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="w-full mb-3">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Interests</h3>
              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, variant === 'compact' ? 3 : profile.interests.length).map((interest: string, idx: number) => (
                  <motion.div
                    key={interest}
                    custom={idx}
                    variants={badgeVariants}
                  >
                    <Badge variant="secondary" className="bg-gradient-to-r from-violet-100 to-purple-100 text-purple-700 border border-purple-200">
                      {interest}
                    </Badge>
                  </motion.div>
                ))}
                {variant === 'compact' && profile.interests.length > 3 && (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    +{profile.interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="w-full mb-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Languages</h3>
              <div className="flex flex-wrap gap-1">
                {profile.languages.slice(0, variant === 'compact' ? 2 : profile.languages.length).map((language: string, idx: number) => (
                  <motion.div
                    key={language}
                    custom={idx}
                    variants={badgeVariants}
                  >
                    <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200">
                      {language}
                    </Badge>
                  </motion.div>
                ))}
                {variant === 'compact' && profile.languages.length > 2 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    +{profile.languages.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex w-full gap-2 mt-auto">
            {onConnect && (
              <Button 
                variant="default" 
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 hover:opacity-90 shadow-md"
                onClick={onConnect}
              >
                <Heart className="mr-2 h-4 w-4" />
                Connect
              </Button>
            )}
            {onMessage && (
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 hover:bg-gray-50"
                onClick={onMessage}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

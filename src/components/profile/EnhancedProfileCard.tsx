
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, BookOpen, User, Languages, Heart, MessageSquare, Coffee, Info, MapPin, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EnhancedProfileCardProps {
  profile: {
    id: string;
    name: string;
    avatar?: string;
    university: string;
    major: string;
    studentType: "local" | "international";
    interests: string[];
    languages: { name: string; proficiency?: string }[];
    bio: string;
    location?: string;
    nationality?: string;
    matchPercentage?: number;
    year?: number | string;
    culturalInsight?: string;
  };
  onConnect?: () => void;
  onMessage?: () => void;
  onMeetup?: () => void;
  className?: string;
  compact?: boolean;
}

export function EnhancedProfileCard({ 
  profile, 
  onConnect, 
  onMessage, 
  onMeetup,
  className = "",
  compact = false
}: EnhancedProfileCardProps) {
  const {
    id,
    name,
    avatar,
    university,
    major,
    studentType,
    interests,
    languages,
    bio,
    location,
    nationality,
    matchPercentage,
    year,
    culturalInsight
  } = profile;
  
  // Create initials for avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  
  // Determine match badge color based on match percentage
  const getMatchColor = (percentage?: number) => {
    if (!percentage) return "bg-gray-100 text-gray-700";
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 75) return "bg-blue-100 text-blue-800";
    if (percentage >= 60) return "bg-yellow-100 text-amber-800";
    return "bg-gray-100 text-gray-700";
  };

  // Student type determines card accent colors
  const cardAccent = studentType === "international" 
    ? "from-pink-500 to-pink-400" 
    : "from-brand-purple to-indigo-500";
  
  const MotionBadge = motion(Badge);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300", className)}
      whileHover={{ y: -5 }}
    >
      {/* Card Header/Banner */}
      <div className={`relative h-24 bg-gradient-to-r ${cardAccent}`}>
        {/* Student type badge */}
        <div className="absolute top-3 right-3 rounded-full px-3 py-1 text-sm font-medium text-white bg-white/20 backdrop-blur-sm border border-white/25 shadow-sm">
          {studentType === "international" ? "International Student" : "Local Student"}
        </div>
        
        {/* Match percentage */}
        {matchPercentage && (
          <motion.div 
            className="absolute -bottom-6 right-6 bg-white dark:bg-gray-900 rounded-full h-16 w-16 flex flex-col items-center justify-center shadow-lg border-4 border-white dark:border-gray-800"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <span className="text-lg font-bold text-brand-purple">{matchPercentage}%</span>
            <span className="text-xs text-gray-500">Match</span>
          </motion.div>
        )}
      </div>
      
      <div className="px-6 pt-6 pb-4">
        {/* Avatar and Name Section */}
        <div className="flex mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Avatar className="h-20 w-20 border-4 border-white dark:border-gray-800 shadow-md -mt-12 mr-4">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-gradient-to-br from-brand-purple to-brand-pink text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          <div className="flex-1 pt-1">
            <motion.h3 
              className="text-xl font-bold"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {name}
            </motion.h3>
            
            <motion.div 
              className="flex items-center text-gray-600 mt-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              <span className="text-sm">{university}</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center text-gray-600"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Globe className="h-4 w-4 mr-1" />
              <span className="text-sm">{major}</span>
            </motion.div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="space-y-3 mb-4">
          {!compact && bio && (
            <motion.div 
              className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              {bio}
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {year && (
              <motion.div 
                className="flex items-center text-sm text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
              >
                <User size={14} className="mr-1 text-brand-purple" />
                <span>Year {year}</span>
              </motion.div>
            )}
            
            {nationality && (
              <motion.div 
                className="flex items-center text-sm text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Globe size={14} className="mr-1 text-brand-pink" />
                <span>From: {nationality}</span>
              </motion.div>
            )}
            
            {location && (
              <motion.div 
                className="flex items-center text-sm text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.55 }}
              >
                <MapPin size={14} className="mr-1 text-brand-blue" />
                <span>{location}</span>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Language Section */}
        {languages.length > 0 && (
          <motion.div 
            className={cn("mb-3", compact ? "hidden" : "")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <div className="flex items-center mb-2">
              <Languages className="h-4 w-4 mr-1 text-brand-purple" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Languages</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {languages.map((lang, idx) => (
                <MotionBadge 
                  key={idx} 
                  variant="outline" 
                  className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + (idx * 0.05) }}
                >
                  {lang.name} {lang.proficiency && <span className="opacity-70">({lang.proficiency})</span>}
                </MotionBadge>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Interests Section */}
        {interests.length > 0 && (
          <motion.div 
            className={cn("mb-3", compact ? "hidden" : "")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <div className="flex items-center mb-2">
              <Heart className="h-4 w-4 mr-1 text-brand-pink" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Interests</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {interests.slice(0, compact ? 3 : 8).map((interest, idx) => (
                <MotionBadge 
                  key={idx} 
                  variant="outline" 
                  className="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-100 dark:border-pink-800"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 + (idx * 0.05) }}
                >
                  {interest}
                </MotionBadge>
              ))}
              {interests.length > (compact ? 3 : 8) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <MotionBadge 
                        variant="outline"
                        className="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-100 dark:border-pink-800 cursor-help"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 + (9 * 0.05) }}
                      >
                        +{interests.length - (compact ? 3 : 8)} more
                      </MotionBadge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-sm">
                        {interests.slice(compact ? 3 : 8).join(', ')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Cultural Insight */}
        {culturalInsight && !compact && (
          <motion.div 
            className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <div className="flex items-center mb-1">
              <Info size={14} className="mr-1" />
              <span className="font-medium">Cultural Insight</span>
            </div>
            <p>{culturalInsight}</p>
          </motion.div>
        )}
        
        {/* Action Buttons */}
        <motion.div 
          className="flex gap-2 mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          {onMessage && (
            <Button 
              variant="outline" 
              className="flex-1 border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10 hover:text-brand-blue/90"
              onClick={onMessage}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </Button>
          )}
          
          {onConnect && (
            <Button 
              variant={onMessage ? "outline" : "default"}
              className={cn(
                "flex-1",
                onMessage ? "border-brand-purple/30 text-brand-purple hover:bg-brand-purple/10 hover:text-brand-purple/90" : 
                "bg-gradient-to-r from-brand-purple to-brand-pink text-white hover:shadow-md"
              )}
              onClick={onConnect}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
          
          {onMeetup && (
            <Button
              variant="outline"
              className="flex-1 border-brand-green/30 text-brand-green hover:bg-brand-green/10 hover:text-brand-green/90"
              onClick={onMeetup}
            >
              <Coffee className="mr-2 h-4 w-4" />
              Meet Up
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

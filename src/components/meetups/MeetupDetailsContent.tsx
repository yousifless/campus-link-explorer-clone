
import React from 'react';
import { MeetupType } from '@/types/database';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, MessageSquare, User, Coffee, Heart, Languages } from 'lucide-react';
import { motion } from 'framer-motion';

interface MeetupDetailsContentProps {
  meetup: MeetupType;
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500';
    case 'pending':
      return 'bg-amber-500';
    case 'canceled':
      return 'bg-red-500';
    case 'completed':
      return 'bg-blue-500';
    case 'sipped':
      return 'bg-emerald-500';
    default:
      return 'bg-gray-400';
  }
}

const MeetupDetailsContent: React.FC<MeetupDetailsContentProps> = ({ meetup }) => {
  // Determine which user to display (creator or invitee) and provide default properties if missing
  const person = meetup.invitee || meetup.creator || {
    first_name: 'Unknown',
    last_name: 'User',
    avatar_url: '',
    interests: [],
    languages: []
  };

  // Animation variants for staggered animation
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="p-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-start gap-4">
        <motion.div variants={itemVariants} className="relative">
          <Avatar className="h-14 w-14 border-2 border-blue-100 shadow-sm">
            <AvatarImage src={person?.avatar_url || ''} alt={person?.first_name || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-medium">
              {getInitials(person?.first_name, person?.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
            <Coffee className="h-4 w-4 text-amber-500" />
          </div>
        </motion.div>
        
        <div className="flex-grow">
          <motion.div variants={itemVariants}>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              {person?.nickname || `${person?.first_name || ''} ${person?.last_name || ''}`}
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {meetup.location_name}
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-3.5 w-3.5 text-blue-700 dark:text-blue-300" />
              </div>
              <span>{formatDate(meetup.date)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900">
                <Clock className="h-3.5 w-3.5 text-purple-700 dark:text-purple-300" />
              </div>
              <span>{new Date(meetup.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            {meetup.location_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900">
                  <MapPin className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
                </div>
                <span>{meetup.location_name}</span>
              </div>
            )}
          </motion.div>

          {/* Interests and Languages */}
          {person?.interests && person.interests.length > 0 && (
            <motion.div variants={itemVariants} className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Interests</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {person.interests.slice(0, 3).map((interest, i) => (
                  <Badge key={i} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 text-xs">
                    {interest}
                  </Badge>
                ))}
                {person.interests.length > 3 && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-xs">
                    +{person.interests.length - 3}
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
          
          {person?.languages && person.languages.length > 0 && (
            <motion.div variants={itemVariants} className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Languages</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {person.languages.slice(0, 3).map((language, i) => {
                  const lang = typeof language === 'string' ? language : language.id;
                  return (
                    <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 text-xs">
                      {lang}
                    </Badge>
                  );
                })}
                {person.languages.length > 3 && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-xs">
                    +{person.languages.length - 3}
                  </Badge>
                )}
              </div>
            </motion.div>
          )}

          {/* Notes section */}
          {meetup.notes && (
            <motion.div variants={itemVariants} className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">{meetup.notes}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MeetupDetailsContent;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClubMeetup } from '@/types/clubs';
import { format, parseISO } from 'date-fns';
import CalendarButtons from '@/components/calendar/CalendarButtons';
import { motion } from 'framer-motion';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock } from 'lucide-react';

interface ClubMeetupCardProps {
  meetup: ClubMeetup;
  clubId: string;
  compact?: boolean;
}

const ClubMeetupCard: React.FC<ClubMeetupCardProps> = ({ 
  meetup, 
  clubId,
  compact = false 
}) => {
  const navigate = useNavigate();
  
  const formattedDate = meetup.date ? 
    format(parseISO(meetup.date), 'EEEE, MMMM d, yyyy') : 
    'Date not specified';
    
  const handleViewDetails = () => {
    navigate(`/clubs/${clubId}/meetups/${meetup.id}`);
  };
  
  // Generate Google Maps link from location_name and location_address
  const getMapsLink = () => {
    if (!meetup.location_name && !meetup.location_address) return undefined;
    const query = encodeURIComponent(
      [meetup.location_name, meetup.location_address].filter(Boolean).join(', ')
    );
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };
  const mapsLink = getMapsLink();
  
  if (compact) {
    return (
      <div 
        className="p-3 border rounded-lg hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
        onClick={handleViewDetails}
      >
        <div>
          <h3 className="font-medium">{meetup.title}</h3>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
            {meetup.time && (
              <>
                <Clock className="h-3 w-3 mx-1" />
                <span>{meetup.time}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          <CalendarButtons 
            title={meetup.title}
            description={meetup.description || ''}
            location={`${meetup.location_name}${meetup.location_address ? `, ${meetup.location_address}` : ''}`}
            date={meetup.date}
            time={meetup.time || '00:00'}
            durationMinutes={meetup.duration_minutes || 60}
            variant="icon"
          />
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04, boxShadow: '0 12px 36px rgba(80,80,180,0.18)' }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-pink-100 shadow-lg hover:shadow-2xl border border-blue-200 overflow-hidden mb-6 group cursor-pointer transition-all"
      tabIndex={0}
      aria-label={`View details for meetup: ${meetup.title}`}
      onClick={handleViewDetails}
    >
      <Card className="overflow-hidden bg-transparent shadow-none border-none">
        <CardHeader className="pb-2 flex flex-row items-center gap-3">
          <div className="flex-1">
            <CardTitle className="text-xl font-extrabold text-blue-900 group-hover:text-indigo-700 transition-colors">
              {meetup.title}
            </CardTitle>
            <CardDescription className="text-xs text-blue-700/80 mt-1">
              <Calendar className="inline h-4 w-4 mr-1 align-text-bottom" />
              {formattedDate}
              {meetup.time && <><span className="mx-1">•</span><Clock className="inline h-4 w-4 mr-1 align-text-bottom" />{meetup.time}</>}
            </CardDescription>
          </div>
          {/* Avatars removed: ClubMeetup does not have attendees field */}
        </CardHeader>
        <CardContent className="pb-2">
          {meetup.description && (
            <p className="text-base text-gray-700 mb-3 line-clamp-2 font-medium">
              {meetup.description}
            </p>
          )}
          {meetup.location_name && (
            <div className="text-sm flex items-center gap-2 mt-2">
              <MapPin className="h-5 w-5 text-pink-500" />
              <span className="font-semibold text-blue-800">{meetup.location_name}</span>
              {meetup.location_address && <span className="text-gray-500">• {meetup.location_address}</span>}
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 px-2 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                  onClick={e => e.stopPropagation()}
                  tabIndex={0}
                  aria-label={`Open location for ${meetup.title} in Google Maps`}
                >
                  View on Map
                </a>
              )}
            </div>
          )}
          <div className="mt-4" onClick={e => e.stopPropagation()}>
            <CalendarButtons 
              title={meetup.title}
              description={meetup.description || ''}
              location={`${meetup.location_name}${meetup.location_address ? `, ${meetup.location_address}` : ''}`}
              date={meetup.date}
              time={meetup.time || '00:00'}
              durationMinutes={meetup.duration_minutes || 60}
              variant="compact"
            />
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto font-semibold group-hover:border-indigo-400 group-hover:text-indigo-700 transition-all"
            onClick={e => { e.stopPropagation(); handleViewDetails(); }}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ClubMeetupCard; 
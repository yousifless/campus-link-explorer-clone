import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';

// Components
import ClubCalendar from '@/components/clubs/ClubCalendar';
import ClubNotifications from '@/components/clubs/ClubNotifications';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { CalendarDays, Plus, RefreshCw, Filter, Download, Calendar } from 'lucide-react';

// Date utilities
import { startOfMonth, endOfMonth, addMonths, format, addDays, isBefore, formatDistance } from 'date-fns';
import { downloadICSFile } from '@/utils/calendarUtils';
import { ClubMeetup } from '@/types/clubs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

const ClubCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // Handle click on calendar event/meetup
  const handleMeetupClick = (meetup: ClubMeetup) => {
    if (meetup.club_id && meetup.id) {
      navigate(`/clubs/${meetup.club_id}/meetups/${meetup.id}`);
    }
  };

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      if (!user) return;
      
      try {
        setLoadingEvents(true);
        
        // Get next 7 days
        const today = new Date();
        const nextWeek = addDays(today, 7);
        
        // Format dates properly
        const todayFormatted = today.toISOString().split('T')[0];
        const nextWeekFormatted = nextWeek.toISOString().split('T')[0];
        
        // Get user's clubs
        const { data: userClubs, error: clubsError } = await supabase.rpc('get_user_clubs', { 
          user_uuid: user.id 
        });
        
        if (clubsError) throw clubsError;
        
        if (!userClubs || userClubs.length === 0) {
          setUpcomingEvents([]);
          setLoadingEvents(false);
          return;
        }
        
        const clubIds = userClubs.map((club: any) => club.id);
        
        // First, get the club meetups
        const { data, error: meetupsError } = await supabase
          .from('club_meetups')
          .select(`
            id, 
            club_id, 
            title, 
            description, 
            date, 
            time,
            duration_minutes,
            location_name
          `)
          .in('club_id', clubIds)
          .gte('date', todayFormatted)
          .lte('date', nextWeekFormatted)
          .order('date', { ascending: true })
          .order('time', { ascending: true });
          
        if (meetupsError) throw meetupsError;
        
        // Safe type check
        const meetupsData = data || [];
        
        if (meetupsData.length === 0) {
          setUpcomingEvents([]);
          setLoadingEvents(false);
          return;
        }
        
        // Then, get club details for each club_id in the meetups
        const uniqueClubIds = [...new Set(meetupsData.map((m: any) => m.club_id))];
        
        const { data: clubsRawData, error: clubDetailsError } = await supabase
          .from('clubs')
          .select('id, name, color')
          .in('id', uniqueClubIds);
          
        if (clubDetailsError) throw clubDetailsError;
        
        // Safe type check
        const clubsData = clubsRawData || [];
        
        // Create a map of club details for easy lookup
        const clubMap = new Map<string, {name: string, color: string}>();
        
        clubsData.forEach((club: any) => {
          clubMap.set(club.id, {
            name: club.name || 'Unknown Club',
            color: club.color || '#4f46e5' // Default color if none is set
          });
        });
        
        // Merge the club details with the meetups
        const meetupsWithClubDetails = meetupsData.map((meetup: any) => ({
          ...meetup,
          club_name: clubMap.get(meetup.club_id)?.name || 'Unknown Club',
          club_color: clubMap.get(meetup.club_id)?.color || '#4f46e5'
        }));
        
        setUpcomingEvents(meetupsWithClubDetails);
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    
    fetchUpcomingEvents();
  }, [user]);
  
  // Export entire month of events as ICS
  const exportCalendar = () => {
    // This would typically fetch all visible events and combine them
    // Into a single calendar file, but for simplicity we'll just show how
    // it could work with a sample event
    
    const event = {
      title: `Club Events (${format(currentMonth, 'MMMM yyyy')})`,
      description: 'Exported calendar of all club events for this month',
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
      url: window.location.origin + '/clubs/calendar',
    };
    
    downloadICSFile(event, `club_events_${format(currentMonth, 'MMM_yyyy')}.ics`);
  };
  
  // Set previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1));
  };
  
  // Set next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };
  
  // Format meetup time for display
  const formatMeetupTime = (date: string, time?: string) => {
    const eventDate = new Date(date);
    
    // If the event is today
    if (isBefore(new Date(), eventDate) && isBefore(eventDate, addDays(new Date(), 1))) {
      return time ? `Today at ${time}` : 'Today';
    }
    
    // If the event is tomorrow
    if (isBefore(addDays(new Date(), 1), eventDate) && isBefore(eventDate, addDays(new Date(), 2))) {
      return time ? `Tomorrow at ${time}` : 'Tomorrow';
    }
    
    // For other dates
    return time 
      ? `${format(eventDate, 'EEE')} at ${time}`
      : format(eventDate, 'EEE, MMM d');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Club Calendar</h1>
            <p className="text-muted-foreground">
              View and manage all your club events in one place
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportCalendar}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Calendar
            </Button>
            <Button 
              onClick={() => navigate('/clubs')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Meetup
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClubCalendar onEventClick={handleMeetupClick} />
          </div>
          
          <div>
            <ClubNotifications />
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>
                  Events happening in the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                {loadingEvents ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    {[1, 2, 3].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 0.5, x: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-12 bg-gradient-to-r from-blue-100 via-blue-50 to-white animate-pulse rounded-lg"
                      />
                    ))}
                  </motion.div>
                ) : upcomingEvents.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-1"
                  >
                    {upcomingEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        whileHover={{ scale: 1.02, backgroundColor: '#f0f6ff' }}
                      >
                        <div 
                          className="relative pl-8 py-3 hover:bg-blue-50 rounded-md transition-colors cursor-pointer" 
                          onClick={() => navigate(`/clubs/${event.club_id}/meetups/${event.id}`)}
                        >
                          <div 
                            className="absolute left-2 top-3 h-4 w-4 rounded-full" 
                            style={{ backgroundColor: event.club_color || '#4f46e5' }} 
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <p className="text-sm font-medium">{event.title}</p>
                              <Badge className="ml-2 text-xs" variant="outline" style={{ 
                                borderColor: event.club_color, 
                                color: event.club_color 
                              }}>
                                {event.club_name}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" /> {formatMeetupTime(event.date, event.time)}
                              {event.duration_minutes && <span className="ml-1">({event.duration_minutes} min)</span>}
                            </p>
                            {event.location_name && (
                              <p className="text-xs text-muted-foreground flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" /> {event.location_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">No upcoming events</p>
                    <p className="text-xs text-gray-400">Join more clubs or create a new meetup</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/clubs')}>
                  View All Clubs
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ClubCalendarPage; 
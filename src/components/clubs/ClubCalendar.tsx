
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/utils/supabase';
import { useNavigate } from 'react-router-dom';
import { ClubMeetup, CalendarEvent } from '@/types/clubs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion'; 

// UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Icons
import { Calendar as CalendarIcon, Filter, List, X, MapPin, Users, Clock } from 'lucide-react';

// Setup localizer for the calendar
const localizer = momentLocalizer(moment);

// Club colors for the calendar - vibrant Gen Z palette
const CLUB_COLORS = [
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#6366F1', // indigo
  '#F97316', // orange
];

interface ClubCalendarProps {
  clubId?: string; // Optional: to filter by specific club
  onEventClick?: (meetup: ClubMeetup) => void;
}

const ClubCalendar: React.FC<ClubCalendarProps> = ({ clubId, onEventClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string; color: string }[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<string[]>(clubId ? [clubId] : []);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<string>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Fetch user's clubs and all meetups
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user's clubs
        let clubsQuery = supabase.rpc('get_user_clubs', { user_uuid: user.id });
        
        const { data: clubsData, error: clubsError } = await clubsQuery;
        
        if (clubsError) throw clubsError;

        // Assign colors to clubs
        const clubsWithColors = clubsData.map((club: any, index: number) => ({
          id: club.id,
          name: club.name,
          color: CLUB_COLORS[index % CLUB_COLORS.length]
        }));
        
        setClubs(clubsWithColors);

        // If clubId is provided, filter by that club, otherwise fetch all user's clubs' meetups
        const clubIds = clubId ? [clubId] : clubsWithColors.map(c => c.id);
        
        // Fetch meetups for these clubs
        const { data: meetupsData, error: meetupsError } = await supabase
          .from('club_meetups')
          .select(`
            id, 
            club_id, 
            title, 
            description, 
            date, 
            time,
            duration_minutes,
            location_name, 
            location_address
          `)
          .in('club_id', clubIds);
          
        if (meetupsError) throw meetupsError;
        
        // Convert to calendar events
        const calendarEvents = meetupsData.map((meetup: any) => {
          const club = clubsWithColors.find(c => c.id === meetup.club_id);
          
          // Parse date and time
          const startDate = new Date(meetup.date);
          if (meetup.time) {
            const [hours, minutes] = meetup.time.split(':').map(Number);
            startDate.setHours(hours, minutes);
          }
          
          // Calculate end time based on available data
          let endDate = new Date(startDate);
          if (meetup.duration_minutes) {
            endDate = new Date(startDate.getTime() + meetup.duration_minutes * 60000);
          } else {
            // Default to 1 hour if no end time or duration
            endDate = new Date(startDate.getTime() + 60 * 60000);
          }
          
          return {
            id: meetup.id,
            title: meetup.title,
            start: startDate,
            end: endDate,
            allDay: !meetup.time,
            club: club,
            meetup: meetup,
          } as CalendarEvent;
        });
        
        setEvents(calendarEvents);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        toast.error('Failed to load calendar events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, clubId]);

  // Handle click on a calendar event
  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event.meetup);
    } else {
      navigate(`/clubs/${event.meetup.club_id}/meetups/${event.id}`);
    }
  };

  // Toggle club filter
  const toggleClubFilter = (id: string) => {
    setSelectedClubs(prev => 
      prev.includes(id) 
        ? prev.filter(clubId => clubId !== id) 
        : [...prev, id]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedClubs([]);
  };

  // Filter events based on selected clubs
  const filteredEvents = selectedClubs.length > 0
    ? events.filter(event => selectedClubs.includes(event.meetup.club_id!))
    : events;

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const clubColor = event.club?.color || '#8B5CF6';
    const isHovered = hoveredEvent?.id === event.id;
    
    return {
      style: {
        backgroundColor: clubColor,
        borderRadius: '8px',
        opacity: isHovered ? 1 : 0.9,
        color: 'white',
        border: '0',
        textAlign: 'center' as 'center',
        padding: '4px',
        boxShadow: isHovered ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }
    };
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-gray-800 dark:to-gray-700">
            <CardTitle className="flex items-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
              <CalendarIcon className="h-5 w-5 mr-2 text-purple-500" />
              Club Events Calendar
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Loading your amazing events...
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-full bg-gradient-to-r from-purple-100 to-blue-100 animate-pulse" />
              <Skeleton className="h-[500px] w-full bg-gradient-to-r from-purple-100 to-blue-100 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="overflow-hidden border border-purple-100 shadow-xl bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-100/70 to-blue-100/70 dark:from-gray-800 dark:to-gray-700 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <motion.div variants={itemVariants}>
              <CardTitle className="flex items-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                <CalendarIcon className="h-5 w-5 mr-2 text-purple-500" />
                Club Events Calendar
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap items-center gap-2"
            >
              <Select 
                defaultValue={view} 
                onValueChange={(value) => setView(value)}
              >
                <SelectTrigger className="w-[110px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-purple-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-gray-600 transition-colors">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-purple-200">
                  <SelectItem value={Views.DAY}>Day</SelectItem>
                  <SelectItem value={Views.WEEK}>Week</SelectItem>
                  <SelectItem value={Views.MONTH}>Month</SelectItem>
                  <SelectItem value={Views.AGENDA}>Agenda</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDate(new Date())}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-purple-200 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-gray-700 transition-all"
              >
                Today
              </Button>
              
              {selectedClubs.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-all"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* Club filters */}
          {clubs.length > 1 && (
            <motion.div 
              variants={itemVariants}
              className="mb-4 flex flex-wrap gap-2 items-center p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-purple-100 dark:border-gray-700"
            >
              <Filter className="h-4 w-4 mr-1 text-purple-500" />
              <span className="text-sm font-medium mr-2 text-gray-700 dark:text-gray-300">Club filters:</span>
              {clubs.map(club => (
                <Badge 
                  key={club.id} 
                  variant={selectedClubs.includes(club.id) ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: selectedClubs.includes(club.id) ? club.color : 'transparent',
                    borderColor: club.color,
                    color: selectedClubs.includes(club.id) ? 'white' : 'inherit'
                  }}
                  onClick={() => toggleClubFilter(club.id)}
                >
                  {club.name}
                </Badge>
              ))}
            </motion.div>
          )}
          
          {/* Calendar component */}
          <motion.div 
            variants={itemVariants}
            className="relative h-[600px] overflow-hidden rounded-lg border border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-inner"
            whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={{
                month: true,
                week: true,
                day: true,
                agenda: true
              }}
              view={view as any}
              onView={(view) => setView(view)}
              date={date}
              onNavigate={date => setDate(date)}
              onSelectEvent={handleEventClick}
              eventPropGetter={eventStyleGetter}
              tooltipAccessor={(event: CalendarEvent) => `${event.title} - ${event.club?.name}`}
              popup
              onShowMore={(events, date) => console.log('Show more', events, date)}
              components={{
                event: (props) => (
                  <div 
                    title={props.title}
                    className="p-1 overflow-hidden"
                    onMouseEnter={() => setHoveredEvent(props.event as CalendarEvent)}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    <div className="text-sm font-semibold truncate">{props.title}</div>
                    {view !== Views.MONTH && (
                      <div className="text-xs truncate">
                        {(props.event as CalendarEvent).club?.name}
                      </div>
                    )}
                  </div>
                ),
                toolbar: (toolbarProps) => (
                  <div className="rbc-toolbar">
                    <span className="rbc-btn-group">
                      <button
                        type="button"
                        onClick={() => toolbarProps.onNavigate('PREV')}
                        className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-l-md p-2 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        &lt;
                      </button>
                      <button
                        type="button"
                        onClick={() => toolbarProps.onNavigate('NEXT')}
                        className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-r-md p-2 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        &gt;
                      </button>
                    </span>
                    <span className="rbc-toolbar-label text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                      {toolbarProps.label}
                    </span>
                    <span className="rbc-btn-group">
                      {toolbarProps.views.map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toolbarProps.onView(name)}
                          className={`${
                            name === toolbarProps.view
                              ? 'bg-purple-100 dark:bg-gray-700 text-purple-700 dark:text-purple-300'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          } border border-purple-200 dark:border-gray-700 p-2 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors`}
                        >
                          {name}
                        </button>
                      ))}
                    </span>
                  </div>
                )
              }}
              className="custom-calendar"
            />

            {/* Event details popup when hovering */}
            <AnimatePresence>
              {hoveredEvent && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-4 right-4 w-64 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-purple-200 dark:border-purple-800 z-50"
                  style={{ 
                    borderLeft: `4px solid ${hoveredEvent.club?.color || '#8B5CF6'}` 
                  }}
                >
                  <h4 className="font-bold text-gray-900 dark:text-white">{hoveredEvent.title}</h4>
                  <Badge 
                    className="mt-1" 
                    style={{ backgroundColor: hoveredEvent.club?.color || '#8B5CF6' }}
                  >
                    {hoveredEvent.club?.name}
                  </Badge>
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                      {moment(hoveredEvent.start).format('ddd, MMM D • h:mm A')}
                    </div>
                    
                    {hoveredEvent.meetup.location_name && (
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        {hoveredEvent.meetup.location_name}
                      </div>
                    )}
                    
                    {hoveredEvent.meetup.description && (
                      <p className="text-xs mt-2 line-clamp-2">{hoveredEvent.meetup.description}</p>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                    onClick={() => handleEventClick(hoveredEvent)}
                  >
                    View Details
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {filteredEvents.length === 0 && (
            <motion.div 
              variants={itemVariants} 
              className="text-center py-8 text-gray-500 dark:text-gray-400"
            >
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm">Try removing filters or join more clubs</p>
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-gray-900/80 dark:to-gray-800/80 p-4 backdrop-blur-sm border-t border-purple-100 dark:border-gray-700">
          <p className="text-xs text-center w-full text-gray-500 dark:text-gray-400">
            Pro tip: Click on any event to see details or add to your personal calendar
          </p>
        </CardFooter>
      </Card>

      {/* Add custom styles for the calendar */}
      <style jsx global>{`
        .rbc-calendar {
          font-family: 'Inter', sans-serif;
        }
        
        .rbc-header {
          padding: 8px;
          font-weight: 600;
          font-size: 0.8rem;
          color: #6B7280;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(5px);
          border-bottom: 1px solid #E9D5FF;
        }
        
        .rbc-month-view, .rbc-time-view {
          border-radius: 0.5rem;
          border: 1px solid #E9D5FF;
          overflow: hidden;
        }
        
        .rbc-date-cell {
          padding: 4px;
          font-weight: 500;
          font-size: 0.85rem;
        }
        
        .rbc-today {
          background-color: rgba(139, 92, 246, 0.05);
        }
        
        .rbc-event {
          border-radius: 6px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .rbc-toolbar button:hover {
          background-color: #EDE9FE;
          color: #6D28D9;
        }
        
        .rbc-toolbar button:active {
          background-color: #DDD6FE;
          color: #6D28D9;
        }
        
        .rbc-toolbar button.rbc-active {
          background-color: #EDE9FE;
          color: #6D28D9;
          box-shadow: none;
        }
        
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #E9D5FF;
        }
        
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid #E9D5FF;
        }
        
        .rbc-off-range-bg {
          background: #F9FAFB;
        }
        
        .rbc-off-range {
          color: #9CA3AF;
        }
        
        .rbc-show-more {
          background-color: transparent;
          color: #8B5CF6;
          font-weight: 500;
        }
        
        .rbc-overlay {
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #E9D5FF;
        }
      `}</style>
    </motion.div>
  );
};

export default ClubCalendar;

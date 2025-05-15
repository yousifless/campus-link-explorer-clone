import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/utils/supabase';
import { useNavigate } from 'react-router-dom';
import { ClubMeetup, CalendarEvent } from '@/types/clubs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

// Icons
import { Calendar as CalendarIcon, Filter, List, X } from 'lucide-react';

// Setup localizer for the calendar
const localizer = momentLocalizer(moment);

// Club colors for the calendar
const CLUB_COLORS = [
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
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
    const clubColor = event.club?.color || '#4f46e5';
    
    return {
      style: {
        backgroundColor: clubColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0',
        textAlign: 'center' as 'center',
        padding: '4px',
      }
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Club Events Calendar
          </CardTitle>
          <CardDescription>Loading calendar events...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Club Events Calendar
            </CardTitle>
            <CardDescription>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select 
              defaultValue={view} 
              onValueChange={(value) => setView(value)}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
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
            >
              Today
            </Button>
            
            {selectedClubs.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Club filters */}
        {clubs.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm font-medium mr-2">Filter by club:</span>
            {clubs.map(club => (
              <Badge 
                key={club.id} 
                variant={selectedClubs.includes(club.id) ? "default" : "outline"}
                className="cursor-pointer"
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
          </div>
        )}
        
        {/* Calendar component */}
        <div className="h-[600px] overflow-hidden rounded-md border">
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
            components={{
              event: (props) => (
                <div title={props.title}>
                  <div className="text-sm font-semibold truncate">{props.title}</div>
                  {view !== Views.MONTH && (
                    <div className="text-xs truncate">
                      {(props.event as CalendarEvent).club?.name}
                    </div>
                  )}
                </div>
              )
            }}
          />
        </div>
        
        {filteredEvents.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No events found. Try removing filters or join more clubs.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubCalendar; 
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

// Custom toolbar component
const CustomToolbar = ({ onNavigate, date, view, onView }) => {
  const navigate = (action) => {
    onNavigate(action);
  };

  return (
    <div className="rbc-toolbar">
      <div className="rbc-toolbar-label">
        {moment(date).format('MMMM YYYY')}
      </div>
      <div className="rbc-btn-group">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('TODAY')}
          className="text-xs h-8"
        >
          Today
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('PREV')}
          className="text-xs h-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('NEXT')}
          className="text-xs h-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="rbc-btn-group">
        <Button 
          variant={view === 'month' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onView('month')}
          className="text-xs h-8"
        >
          Month
        </Button>
        <Button 
          variant={view === 'week' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onView('week')}
          className="text-xs h-8"
        >
          Week
        </Button>
        <Button 
          variant={view === 'day' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onView('day')}
          className="text-xs h-8"
        >
          Day
        </Button>
        <Button 
          variant={view === 'agenda' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => onView('agenda')}
          className="text-xs h-8"
        >
          Agenda
        </Button>
      </div>
    </div>
  );
};

// Custom styles for the calendar
const calendarStyles = `
  .rbc-calendar {
    font-family: Inter, system-ui, sans-serif;
    border-radius: 0.5rem;
    overflow: hidden;
    background: white;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .rbc-header {
    padding: 10px;
    font-weight: 500;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .rbc-event {
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 0.875rem;
    border: none;
    background-color: var(--event-bg-color, #4f46e5);
  }

  .rbc-day-bg {
    transition: background-color 0.2s;
  }

  .rbc-day-bg:hover {
    background-color: rgba(248, 250, 252, 0.8);
  }

  .rbc-today {
    background-color: rgba(225, 215, 255, 0.3);
  }

  .rbc-btn-group button {
    border-color: #e2e8f0;
    color: #334155;
    transition: all 0.2s;
  }

  .rbc-btn-group button:hover {
    background-color: #f1f5f9;
  }

  .rbc-btn-group button.rbc-active {
    background-color: #4f46e5;
    color: white;
    border-color: #4f46e5;
  }

  .rbc-btn-group button.rbc-active:hover {
    background-color: #4338ca;
  }
`;

const ClubCalendar = ({ clubId, isAdmin = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const localizer = momentLocalizer(moment);

  useEffect(() => {
    if (clubId) {
      fetchMeetups();
    }
  }, [clubId]);

  const fetchMeetups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_meetups')
        .select('*')
        .eq('club_id', clubId);

      if (error) throw error;

      if (data) {
        const formattedEvents = data.map(meetup => ({
          id: meetup.id,
          title: meetup.title,
          start: new Date(`${meetup.date}T${meetup.time || '00:00:00'}`),
          end: new Date(`${meetup.date}T${meetup.end_time || '00:00:00'}`),
          location: meetup.location_name || 'No location',
          description: meetup.description,
          allDay: false,
          resource: meetup
        }));

        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching meetups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    navigate(`/clubs/${clubId}/meetups/${event.id}`);
  };

  const handleSelectSlot = ({ start, end }) => {
    if (isAdmin) {
      navigate(`/clubs/${clubId}/meetups/new`, {
        state: { 
          defaultStartTime: start.toISOString(),
          defaultEndTime: end.toISOString()
        }
      });
    }
  };

  const eventStyleGetter = (event) => {
    const now = new Date();
    const isPast = event.end < now;
    
    return {
      style: {
        '--event-bg-color': isPast ? '#94a3b8' : '#4f46e5',
        opacity: isPast ? 0.7 : 1
      }
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative mb-6">
      {/* Style tag fixed to remove jsx and global properties */}
      <style>{calendarStyles}</style>
      
      {isAdmin && (
        <Button
          className="absolute top-2 right-2 z-10"
          size="sm"
          onClick={() => navigate(`/clubs/${clubId}/meetups/new`)}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Meetup
        </Button>
      )}
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable={isAdmin}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar
        }}
      />
    </div>
  );
};

export default ClubCalendar;

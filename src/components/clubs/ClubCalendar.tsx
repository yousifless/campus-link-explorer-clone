import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { initialEvents } from './event-utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
}

const ClubCalendar = () => {
  const [weekendsVisible, setWeekendsVisible] = useState(true)
  const [currentEvents, setCurrentEvents] = useState(initialEvents)
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const { toast } = useToast()
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const { clubId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [clubId]);

  const fetchEvents = async () => {
    if (!clubId) {
      console.error("Club ID is missing");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('club_meetups')
        .select('*')
        .eq('club_id', clubId);

      if (error) {
        throw error;
      }

      if (data) {
        const formattedEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          description: event.description,
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    }
  };

  const handleEventClick = (clickInfo: any) => {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove()
    }
  }

  const handleDateSelect = (selectInfo: any) => {
    let title = prompt('Please enter a new title for your event')
    let calendarApi = selectInfo.view.calendar

    calendarApi.unselect() // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      })
    }
  }

  const handleEventAdd = (addInfo: any) => {
    // Handle event add logic here
  }

  const handleEventChange = (changeInfo: any) => {
    // Handle event change logic here
  }

  const handleEventDelete = (deleteInfo: any) => {
    // Handle event delete logic here
  }

  const [currentView, setCurrentView] = useState('dayGridMonth');

  const renderSidebar = () => {
    return (
      <div className='p-4'>
        <div className='mb-4'>
          <Button onClick={() => navigate(`/clubs/${clubId}/meetups/new`)}>Add Event</Button>
        </div>
        <h2 className='text-xl font-semibold mb-2'>Instructions</h2>
        <ul className='list-disc pl-5'>
          <li>Select dates and you will be prompted to create a new event</li>
          <li>Drag, drop, and resize events</li>
          <li>Click an event to delete it</li>
        </ul>
      </div>
    )
  }

  let eventGuid = 0
  function createEventId() {
    return String(eventGuid++)
  }

  return (
    <div className='container mx-auto p-4 custom-calendar'>
      <style dangerouslySetInnerHTML={{
  __html: `
    .custom-calendar .fc-day-today {
      background-color: rgba(66, 146, 198, 0.1) !important;
    }
    .custom-calendar .fc-event {
      cursor: pointer;
      border-radius: 4px;
      padding: 2px;
      font-size: 0.8rem;
    }
    .custom-calendar .fc-daygrid-day-number {
      font-weight: 500;
    }
    .fc-theme-standard .fc-list-day-cushion {
      background-color: rgba(66, 146, 198, 0.1) !important;
    }
    .custom-calendar .fc-button {
      background-color: #4292c6 !important;
      border-color: #4292c6 !important;
      box-shadow: none !important;
    }
    .custom-calendar .fc-button-primary:disabled {
      background-color: rgba(66, 146, 198, 0.5) !important;
      border-color: rgba(66, 146, 198, 0.5) !important;
    }
  `
}} />
      <div className="flex">
        <aside className="w-64 p-4 border-r">
          {renderSidebar()}
        </aside>
        <div className="flex-1">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={weekendsVisible}
            events={events}
            select={handleDateSelect}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            eventsSet={handleEvents}
            eventAdd={handleEventAdd}
            eventChange={handleEventChange}
            eventRemove={handleEventDelete}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )

  function renderEventContent(eventInfo: any) {
    return (
      <>
        <b>{eventInfo.timeText}</b>
        <span>{eventInfo.event.title}</span>
      </>
    )
  }

  function handleWeekendsToggle() {
    setWeekendsVisible(!weekendsVisible)
  }

  function handleEvents(events: any) {
    setCurrentEvents(events)
  }
}

export default ClubCalendar;

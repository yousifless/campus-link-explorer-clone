import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MeetupStatus } from '@/types/coffee-meetup';

interface Meetup {
  id: string;
  date: string;
  status: MeetupStatus;
}

interface CoffeeMeetupCalendarProps {
  meetups: Meetup[];
  onDateSelect: (date: Date) => void;
}

const EventIndicator: React.FC<{ status: MeetupStatus }> = ({ status }) => {
  return (
    <motion.div
      className={cn(
        'absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full',
        status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

const getMeetupStatusColor = (status: MeetupStatus) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'declined':
      return 'bg-red-100 text-red-800';
    case 'rescheduled':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const CoffeeMeetupCalendar: React.FC<CoffeeMeetupCalendarProps> = ({
  meetups,
  onDateSelect,
}) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const meetupDates = meetups.map(meetup => new Date(meetup.date));

  const modifiers = {
    hasMeetup: (date: Date) => meetupDates.some(meetupDate => 
      format(meetupDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ),
  };

  const modifiersStyles = {
    hasMeetup: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)', // Light green background
      border: '2px solid rgb(34, 197, 94)', // Green border
      borderRadius: '50%',
    },
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      onDateSelect(selectedDate);
    }
  };

  const getMeetupsForDate = (date: Date) => {
    return meetups.filter(
      (meetup) => format(new Date(meetup.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const renderDay = (date: Date) => {
    const meetups = getMeetupsForDate(date);
    const hasMeetups = meetups.length > 0;
    const status = meetups[0]?.status;

    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <div
          className={cn(
            'relative',
            hasMeetups && 'font-semibold',
            getMeetupStatusColor(status)
          )}
        >
          {format(date, 'd')}
        </div>
        {hasMeetups && <EventIndicator status={status} />}
      </motion.div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <span>Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border"
          components={{
            Day: ({ date }) => renderDay(date)
          }}
        />

        <AnimatePresence mode="wait">
          {date && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-4 border-t pt-4"
            >
              <h3 className="font-medium mb-2">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="text-sm text-muted-foreground">
                {getMeetupsForDate(date).length > 0 ? (
                  <p>You have {getMeetupsForDate(date).length} meetup{getMeetupsForDate(date).length > 1 ? 's' : ''} scheduled on this date.</p>
                ) : (
                  <p>No meetups scheduled for this date.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}; 
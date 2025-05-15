import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, isBefore, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Popover } from '@headlessui/react';

// Types for meetups
export type MeetupDay = {
  date: string; // ISO string
  status: 'upcoming' | 'past';
  title: string;
  description?: string;
};

interface AnimatedMeetupCalendarProps {
  meetups: MeetupDay[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

// Customization: Colors and animation variants
const UPCOMING_COLOR = 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-blue-600 shadow-lg';
const PAST_COLOR = 'bg-gray-200 text-gray-400 border-gray-300';
const SELECTED_RING = 'ring-4 ring-indigo-300';
const TODAY_RING = 'ring-2 ring-yellow-400';

const dayAnim = {
  rest: { scale: 1, boxShadow: '0 0 #0000' },
  hover: { scale: 1.08, boxShadow: '0 4px 16px 0 rgba(80,80,180,0.10)' },
  pressed: { scale: 0.96 },
};

// Helper to find meetup for a date
function getMeetupForDate(date: Date, meetups: MeetupDay[]) {
  return meetups.find(m => isSameDay(new Date(m.date), date));
}

export const AnimatedMeetupCalendar: React.FC<AnimatedMeetupCalendarProps> = ({ meetups, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);

  // Build the calendar grid
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [currentMonth]);

  // Navigation handlers
  const prevMonth = () => setCurrentMonth(prev => addDays(startOfMonth(prev), -1));
  const nextMonth = () => setCurrentMonth(prev => addDays(endOfMonth(prev), 1));

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, date: Date) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDateSelect?.(date);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-2xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} aria-label="Previous month" className="p-2 rounded hover:bg-gray-100">
          &lt;
        </button>
        <h2 className="text-lg font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={nextMonth} aria-label="Next month" className="p-2 rounded hover:bg-gray-100">
          &gt;
        </button>
      </div>
      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-xs font-semibold text-gray-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, idx) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const meetup = getMeetupForDate(date, meetups);
          const isUpcoming = meetup?.status === 'upcoming';
          const isPast = meetup?.status === 'past';
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isFocused = focusedDate && isSameDay(date, focusedDate);
          const isTodayDate = isToday(date);

          let dayClass = 'relative flex items-center justify-center aspect-square w-10 h-10 rounded-lg transition-all duration-200 outline-none cursor-pointer';
          let highlight = '';
          if (isUpcoming) highlight = UPCOMING_COLOR;
          else if (isPast) highlight = PAST_COLOR;
          else highlight = isCurrentMonth ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-300';
          if (isSelected) highlight += ` ${SELECTED_RING}`;
          else if (isTodayDate) highlight += ` ${TODAY_RING}`;

          return (
            <Popover key={date.toISOString()}>
              <Popover.Button
                as={motion.button}
                initial="rest"
                whileHover="hover"
                whileTap="pressed"
                variants={dayAnim}
                className={dayClass + ' ' + highlight}
                tabIndex={isCurrentMonth ? 0 : -1}
                aria-label={format(date, 'PPP') + (meetup ? `: ${meetup.title}` : '')}
                onClick={() => isCurrentMonth && onDateSelect?.(date)}
                onFocus={() => setFocusedDate(date)}
                onBlur={() => setFocusedDate(null)}
                onKeyDown={e => handleKeyDown(e, date)}
              >
                <span className="z-10 font-semibold">{date.getDate()}</span>
                {/* Animated highlight for selection */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      layoutId="selected-day"
                      className="absolute inset-0 rounded-lg bg-indigo-200/40 pointer-events-none"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </AnimatePresence>
                {/* Meetup indicator dot */}
                {meetup && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${isUpcoming ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                )}
              </Popover.Button>
              {/* Tooltip/popover for meetup details */}
              {meetup && (
                <Popover.Panel className="absolute z-20 mt-2 w-48 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-4 border border-gray-100 text-sm animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <InformationCircleIcon className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-blue-700">{meetup.title}</span>
                  </div>
                  <div className="text-gray-600">{meetup.description || (isUpcoming ? 'Upcoming meetup' : 'Past meetup')}</div>
                  <div className="mt-2 text-xs text-gray-400">{format(new Date(meetup.date), 'PPP')}</div>
                </Popover.Panel>
              )}
            </Popover>
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedMeetupCalendar; 
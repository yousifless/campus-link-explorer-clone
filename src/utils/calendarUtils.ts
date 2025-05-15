/**
 * Utilities for calendar operations, including export to different calendar formats
 */

import { createEvent } from 'ics';
import { format, parseISO, addMinutes } from 'date-fns';

/**
 * Generate an iCalendar (.ics) file content for a calendar event
 * 
 * @param event - Calendar event details
 * @returns String with iCalendar formatted content
 */
export const generateICSContent = (event: {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
}): string => {
  // Format date to YYYYMMDDTHHMMSSZ format (UTC)
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
  };

  // Generate a unique identifier
  const generateUID = (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}@campuslink.app`;
  };

  // Create ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusLink//Club Meetups//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${generateUID()}`,
    `SUMMARY:${event.title}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.start)}`,
    `DTEND:${formatDate(event.end)}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    event.url ? `URL:${event.url}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return icsContent;
};

/**
 * Generate a Google Calendar event URL
 * 
 * @param event - Calendar event details
 * @returns URL to create event in Google Calendar
 */
export const generateGoogleCalendarUrl = (
  title: string,
  description: string,
  location: string,
  startDate: string,
  startTime: string,
  durationMinutes: number
): string => {
  const start = formatDateForGoogleCalendar(startDate, startTime);
  const end = formatDateForGoogleCalendar(
    startDate,
    format(addMinutes(parseISO(`${startDate}T${startTime}`), durationMinutes), 'HH:mm')
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${start}/${end}&details=${encodeURIComponent(
    description
  )}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
};

/**
 * Generate a Microsoft Outlook calendar event URL
 * 
 * @param event - Calendar event details
 * @returns URL to create event in Outlook
 */
export const generateOutlookCalendarUrl = (event: {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}): string => {
  // Format date for Outlook
  const formatOutlookDate = (date: Date): string => {
    return date.toISOString();
  };

  const params = new URLSearchParams({
    subject: event.title,
    body: event.description || '',
    startdt: formatOutlookDate(event.start),
    enddt: formatOutlookDate(event.end),
    location: event.location || '',
    path: '/calendar/action/compose',
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate a Yahoo calendar event URL
 * 
 * @param event - Calendar event details
 * @returns URL to create event in Yahoo Calendar
 */
export const generateYahooCalendarUrl = (event: {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}): string => {
  // Format date for Yahoo (in seconds since epoch)
  const formatYahooDate = (date: Date): string => {
    return `${Math.floor(date.getTime() / 1000)}`;
  };

  const params = new URLSearchParams({
    title: event.title,
    desc: event.description || '',
    st: formatYahooDate(event.start),
    et: formatYahooDate(event.end),
    in_loc: event.location || '',
    v: '60',
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
};

/**
 * Creates a downloadable .ics file from calendar event
 * 
 * @param event - Calendar event details
 * @param filename - Optional filename (defaults to event title)
 */
export const downloadICSFile = (
  event: {
    title: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    url?: string;
  },
  filename?: string
): void => {
  const icsContent = generateICSContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `${event.title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Calculate duration between two dates in minutes
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Duration in minutes
 */
export const calculateDurationInMinutes = (start: Date, end: Date): number => {
  return Math.round((end.getTime() - start.getTime()) / (60 * 1000));
};

/**
 * Add minutes to a date
 * 
 * @param date - Base date
 * @param minutes - Minutes to add
 * @returns New date with minutes added
 */
export const addMinutesToDate = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

/**
 * Format a date to display in a user-friendly way
 * 
 * @param date - Date to format
 * @param includeTime - Whether to include time
 * @returns Formatted date string
 */
export const formatUserFriendlyDate = (date: Date, includeTime: boolean = false): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = 'numeric';
  }
  
  return date.toLocaleDateString('en-US', options);
};

// Function to format date for Google Calendar URL
export const formatDateForGoogleCalendar = (date: string, time: string): string => {
  const dateTime = parseISO(`${date}T${time}`);
  return format(dateTime, "yyyyMMdd'T'HHmmss");
};

// Generate ICS data
export const generateIcsData = (
  title: string,
  description: string,
  location: string,
  startDate: string,
  startTime: string,
  durationMinutes: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dateObj = parseISO(`${startDate}T${startTime}`);
    
    // Format to array of numbers as required by ics
    const icsDate: [number, number, number, number, number] = [
      dateObj.getFullYear(),
      dateObj.getMonth() + 1, // Month is 0-indexed in JS, but 1-indexed in ics
      dateObj.getDate(),
      dateObj.getHours(),
      dateObj.getMinutes()
    ];
    
    createEvent(
      {
        start: icsDate,
        duration: { minutes: durationMinutes },
        title,
        description,
        location,
        url: window.location.href,
      }, 
      (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value || '');
        }
      }
    );
  });
};

// Generate ICS file and trigger download
export const downloadIcsFile = async (
  title: string,
  description: string,
  location: string,
  startDate: string,
  startTime: string,
  durationMinutes: number,
  filename = 'event.ics'
): Promise<void> => {
  try {
    const icsData = await generateIcsData(title, description, location, startDate, startTime, durationMinutes);
    
    // Create a blob and download link
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating ICS file:', error);
    throw error;
  }
}; 
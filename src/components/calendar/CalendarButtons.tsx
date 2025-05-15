import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/utils/calendarUtils';
import { toast } from 'sonner';

interface CalendarButtonsProps {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  durationMinutes: number;
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
}

const CalendarButtons: React.FC<CalendarButtonsProps> = ({
  title,
  description,
  location,
  date,
  time,
  durationMinutes,
  variant = 'default',
  className = ''
}) => {
  const googleCalendarUrl = generateGoogleCalendarUrl(
    title,
    description,
    location,
    date,
    time,
    durationMinutes
  );

  const handleDownloadIcs = async () => {
    try {
      await downloadIcsFile(
        title,
        description,
        location,
        date,
        time,
        durationMinutes,
        `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
      );
      toast.success('Calendar file downloaded');
    } catch (error) {
      console.error('Error downloading ICS file:', error);
      toast.error('Failed to download calendar file');
    }
  };

  if (variant === 'icon') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(googleCalendarUrl, '_blank');
                }}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to Google Calendar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadIcs();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download .ics file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            window.open(googleCalendarUrl, '_blank');
          }}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Google Calendar
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadIcs();
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          .ics File
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <Button 
        variant="outline" 
        className="w-full sm:w-auto"
        onClick={(e) => {
          e.stopPropagation();
          window.open(googleCalendarUrl, '_blank');
        }}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Add to Google Calendar
      </Button>
      <Button 
        variant="outline" 
        className="w-full sm:w-auto"
        onClick={(e) => {
          e.stopPropagation();
          handleDownloadIcs();
        }}
      >
        <Download className="h-4 w-4 mr-2" />
        Download .ics File
      </Button>
    </div>
  );
};

export default CalendarButtons; 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Plus, X, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const amPm = i < 12 ? 'AM' : 'PM';
  return {
    value: `${i.toString().padStart(2, '0')}:00`,
    label: `${hour}:00 ${amPm}`,
  };
});

// Add half-hour slots
const allTimeSlots = timeSlots.flatMap(slot => {
  const hour = parseInt(slot.value.split(':')[0]);
  const halfHour = `${hour.toString().padStart(2, '0')}:30`;
  const halfHourLabel = `${hour % 12 || 12}:30 ${hour < 12 ? 'AM' : 'PM'}`;
  
  return [
    slot,
    { value: halfHour, label: halfHourLabel }
  ];
});

interface TimeRange {
  start_time: string;
  end_time: string;
}

interface DayAvailability {
  [day: string]: TimeRange[];
}

interface AvailabilityCalendarProps {
  onSave: (availability: DayAvailability) => Promise<void>;
  initialAvailability?: DayAvailability;
}

export const AvailabilityCalendar = ({ onSave, initialAvailability = {} }: AvailabilityCalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availability, setAvailability] = useState<DayAvailability>(initialAvailability);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [newTimeRange, setNewTimeRange] = useState<{ start: string; end: string }>({ start: '09:00', end: '17:00' });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (initialAvailability) {
      setAvailability(initialAvailability);
    }
  }, [initialAvailability]);

  const handleAddTimeRange = () => {
    // Validate time range
    const startHour = parseInt(newTimeRange.start.split(':')[0]);
    const endHour = parseInt(newTimeRange.end.split(':')[0]);
    const startMinute = parseInt(newTimeRange.start.split(':')[1]);
    const endMinute = parseInt(newTimeRange.end.split(':')[1]);
    
    if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive"
      });
      return;
    }
    
    // Add new time range
    setAvailability(prev => {
      const updatedDay = [...(prev[selectedDay] || [])];
      updatedDay.push({
        start_time: newTimeRange.start,
        end_time: newTimeRange.end
      });
      
      // Sort time ranges
      updatedDay.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });
      
      return {
        ...prev,
        [selectedDay]: updatedDay
      };
    });
  };

  const handleRemoveTimeRange = (day: string, index: number) => {
    setAvailability(prev => {
      const updatedDay = [...(prev[day] || [])];
      updatedDay.splice(index, 1);
      
      return {
        ...prev,
        [day]: updatedDay
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(availability);
      toast({
        title: "Success",
        description: "Your availability has been saved",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save your availability",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeRange = (start: string, end: string) => {
    // Convert 24-hour format to 12-hour format
    const formatTime = (time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      const period = hour < 12 ? 'AM' : 'PM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Set Your Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Your Availability</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay} className="mt-4">
          <TabsList className="grid grid-cols-7 mb-4">
            {daysOfWeek.map(day => (
              <TabsTrigger 
                key={day} 
                value={day}
                className="text-xs relative"
              >
                {day.slice(0, 3)}
                {availability[day]?.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-green-500">
                    {availability[day].length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {daysOfWeek.map(day => (
            <TabsContent key={day} value={day} className="space-y-4">
              <div className="flex flex-col">
                <h3 className="font-medium mb-2">{day}</h3>
                
                {/* Time ranges for the selected day */}
                {availability[day]?.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <AnimatePresence>
                      {availability[day].map((range, idx) => (
                        <motion.div 
                          key={`${day}-${idx}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                        >
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">
                              {formatTimeRange(range.start_time, range.end_time)}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleRemoveTimeRange(day, idx)}
                          >
                            <X className="h-4 w-4 text-gray-400" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic mb-4">No availability set for {day}</p>
                )}
                
                {/* Add new time range */}
                <div className="border rounded-md p-3 bg-gray-50">
                  <h4 className="text-sm font-medium mb-2">Add Time Slot</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
                      <Select 
                        value={newTimeRange.start}
                        onValueChange={(value) => setNewTimeRange(prev => ({ ...prev, start: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {allTimeSlots.map(time => (
                            <SelectItem key={`start-${time.value}`} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">End Time</label>
                      <Select 
                        value={newTimeRange.end}
                        onValueChange={(value) => setNewTimeRange(prev => ({ ...prev, end: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {allTimeSlots.map(time => (
                            <SelectItem key={`end-${time.value}`} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={handleAddTimeRange}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Time Slot
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>Saving</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Availability
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityCalendar; 
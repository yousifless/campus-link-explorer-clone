import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import MapLocationPicker from './MapLocationPicker';

interface ScheduleMeetupModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (data: any) => Promise<void>;
  matchedUserId: string;
}

const ScheduleMeetupModal: React.FC<ScheduleMeetupModalProps> = ({
  open,
  onClose,
  onSchedule,
  matchedUserId,
}) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [conversationStarter, setConversationStarter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSchedule = async () => {
    if (!date || !location) return;

    setIsLoading(true);
    try {
      // Fix the date format issue by ensuring we pass a Date object
      await onSchedule({
        date,
        location_name: location.name || '',
        location_address: location.formatted_address || '',
        location_lat: location.geometry?.location?.lat() || 0,
        location_lng: location.geometry?.location?.lng() || 0,
        additional_notes: notes,
        conversation_starter: conversationStarter,
        receiver_id: matchedUserId,
      });
      onClose();
    } catch (error) {
      console.error('Error scheduling meetup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Schedule a Coffee Meetup</DialogTitle>
          <DialogDescription>
            Plan a coffee meetup to connect in person and build your friendship.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= i
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  } transition-all duration-300`}
                >
                  {i}
                </div>
                {i < 3 && (
                  <div
                    className={`h-1 flex-1 ${
                      step > i ? 'bg-indigo-600' : 'bg-gray-200'
                    } transition-all duration-300`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">When would you like to meet?</h3>
              
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(day) => day < new Date()}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <div className="grid grid-cols-3 gap-2">
                  {["Morning", "Afternoon", "Evening"].map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      className="hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all"
                      onClick={() => {
                        // In a real app, you'd update the time here
                      }}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Where would you like to meet?</h3>
              
              <div className="h-[300px] w-full rounded-md overflow-hidden border border-gray-200">
                <MapLocationPicker 
                  defaultLocation={location || undefined}
                  onLocationChange={setLocation}
                />
              </div>
              
              {location && (
                <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{location.name}</h4>
                      <p className="text-sm text-gray-600">{location.formatted_address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Any additional notes?</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conversation Starter (optional)
                </label>
                <Input
                  placeholder="Any specific topics you'd like to discuss?"
                  value={conversationStarter}
                  onChange={(e) => setConversationStarter(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (optional)
                </label>
                <Textarea
                  placeholder="Any other details or preferences for the meetup?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="p-4 rounded-md bg-blue-50 border border-blue-100 text-blue-800">
                <h4 className="font-medium mb-1">Meetup Details</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <span className="font-medium">When:</span> {date ? format(date, 'PPP') : 'Date not selected'}
                  </li>
                  <li>
                    <span className="font-medium">Where:</span> {location ? location.name : 'Location not selected'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex space-x-2 sm:space-x-0">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
            
            {step < 3 ? (
              <Button 
                type="button"
                onClick={nextStep}
                className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                disabled={
                  (step === 1 && !date) ||
                  (step === 2 && !location)
                }
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSchedule}
                className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                disabled={isLoading || !date || !location}
              >
                {isLoading ? 'Scheduling...' : 'Schedule Meetup'}
              </Button>
            )}
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetupModal;


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import MapLocationPicker from './MapLocationPicker';
import { createMeetup } from '@/utils/meetups';
import { useToast } from '@/components/ui/use-toast';

interface ScheduleMeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  matchedUser: {
    id: string;
    first_name: string;
    last_name: string;
    interests: string[];
  };
}

export const ScheduleMeetupModal: React.FC<ScheduleMeetupModalProps> = ({
  isOpen,
  onClose,
  matchId,
  matchedUser,
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!date || !time || !location) return;

    setLoading(true);
    try {
      const meetupDate = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      meetupDate.setHours(hours, minutes);

      await createMeetup({
        title: `Meetup with ${matchedUser.first_name}`,
        description: `Let's meet at ${location.name}!`,
        date: meetupDate,
        location: {
          name: location.name,
          address: location.formatted_address,
          lat: location.geometry.location.lat(),
          lng: location.geometry.location.lng(),
        },
        creator_id: matchedUser.id,
        invitee_id: matchedUser.id,
      });

      toast({
        title: 'Meetup Scheduled!',
        description: `You've scheduled a meetup with ${matchedUser.first_name} at ${location.name}`,
      });
      onClose();
    } catch (error) {
      console.error('Error creating meetup:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule meetup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateConversationStarters = () => {
    const sharedInterests = matchedUser.interests || [];
    return sharedInterests.map((interest) => ({
      topic: interest,
      questions: [
        `What got you interested in ${interest}?`,
        `What's your favorite thing about ${interest}?`,
        `How long have you been into ${interest}?`,
      ],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule a Meetup</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <MapLocationPicker
              onPlaceSelected={setLocation}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Conversation Starters</label>
            <div className="grid grid-cols-1 gap-2">
              {generateConversationStarters().map((starter) => (
                <div key={starter.topic} className="rounded-lg border p-4">
                  <h4 className="font-medium">{starter.topic}</h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {starter.questions.map((question, index) => (
                      <li key={index}>• {question}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!date || !time || !location || loading}
          >
            {loading ? 'Scheduling...' : 'Schedule Meetup'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


import React, { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

interface MeetupProposalFormProps {
  matchId: string;
  receiverId: string;
  selectedDate: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

// Define the proper type for createMeetup's parameters
interface MeetupProposal {
  match_id: string;
  receiver_id: string;
  date: string;
  message?: string;
  location_name: string; // Changed from location to location_name
}

// Import the actual service function
import { createMeetup as createMeetupService } from '@/services/coffee-meetups';

export const MeetupProposalForm: React.FC<MeetupProposalFormProps> = ({
  matchId,
  receiverId,
  selectedDate,
  onSuccess,
  onCancel
}) => {
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createMeetupService({
        match_id: matchId,
        receiver_id: receiverId,
        date: selectedDate.toISOString(),
        location_name: location, // Using location_name instead of location
        message
      });

      toast({
        title: "Success",
        description: "Meetup proposal sent successfully",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send meetup proposal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold">
        Propose Meetup for {format(selectedDate, 'MMMM d, yyyy')}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
          </label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter meeting location"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message (Optional)
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message for your match"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Proposal'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}; 

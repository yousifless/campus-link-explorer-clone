
import React from 'react';
import { CoffeeMeetup, MeetupStatus } from '@/types/coffee-meetup';
import { updateMeetup } from '@/services/coffee-meetups';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface MeetupActionsProps {
  meetup: CoffeeMeetup;
  onUpdate: (updatedMeetup: CoffeeMeetup) => void;
  onReschedule: () => void;
}

export const MeetupActions: React.FC<MeetupActionsProps> = ({
  meetup,
  onUpdate,
  onReschedule
}) => {
  const { toast } = useToast();

  const handleAction = async (action: 'accept' | 'decline') => {
    try {
      const status: MeetupStatus = action === 'accept' ? 'confirmed' : 'declined';
      
      // Ensure the meetup status is properly typed
      const typedMeetup: CoffeeMeetup = {
        ...meetup,
        status: meetup.status as MeetupStatus
      };
      
      const updatedMeetup = await updateMeetup(typedMeetup.id, {
        status: status
      });

      onUpdate(updatedMeetup);

      toast({
        title: "Success",
        description: `Meetup ${action}ed successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} meetup`,
        variant: "destructive",
      });
    }
  };

  // Don't show actions if this isn't a pending meetup
  if (meetup.status !== 'pending') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end space-x-2 mt-4"
    >
      <Button
        variant="outline"
        onClick={() => handleAction('decline')}
        className="text-red-600 border-red-600 hover:bg-red-50"
      >
        Decline
      </Button>
      <Button
        variant="outline"
        onClick={onReschedule}
        className="text-blue-600 border-blue-600 hover:bg-blue-50"
      >
        Reschedule
      </Button>
      <Button
        onClick={() => handleAction('accept')}
        className="bg-green-600 hover:bg-green-700"
      >
        Accept
      </Button>
    </motion.div>
  );
};

export default MeetupActions;

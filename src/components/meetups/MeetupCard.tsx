import React from 'react';
import { MeetupType } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, MessageSquare, CheckCircle, X, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import MeetupDetailsContent from './MeetupDetailsContent';

interface MeetupCardProps {
  meetup: MeetupType;
}

const MeetupCard: React.FC<MeetupCardProps> = ({ meetup }) => {
  const { toast } = useToast();
  const person = meetup.creator_id === 'current-user-id' ? meetup.invitee : meetup.creator;
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEE, MMM d, yyyy');
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-amber-500';
      case 'canceled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAccept = () => {
    toast({
      title: "Meetup accepted",
      description: `You have accepted the meetup with ${person?.first_name} on ${formatDate(meetup.proposed_date)}.`,
    });
  };

  const handleDecline = () => {
    toast({
      title: "Meetup declined",
      description: `You have declined the meetup with ${person?.first_name}.`,
    });
  };

  const handleReschedule = () => {
    toast({
      description: "Reschedule option will open soon.",
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <MeetupDetailsContent meetup={meetup} />
        <Badge
          variant={
            meetup.status === 'canceled' ? 'destructive' :
            meetup.status === 'confirmed' ? 'default' :
            meetup.status === 'sipped' ? 'default' :
            'secondary'
          }
          className={meetup.status === 'sipped' ? 'bg-green-500 text-white' : ''}
        >
          {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
        </Badge>
        {/* Action buttons and other logic remain here if needed */}
      </CardContent>
    </Card>
  );
};

export default MeetupCard;

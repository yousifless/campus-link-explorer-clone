
import React from 'react';
import { MeetupType } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, MessageSquare, CheckCircle, X, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

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
        <div className="flex flex-col md:flex-row">
          <div className="p-4 md:p-6 flex-grow">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={person?.avatar_url || ''} alt={person?.first_name || 'User'} />
                <AvatarFallback>{getInitials(person?.first_name, person?.last_name)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {person?.first_name} {person?.last_name}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(meetup.status)} text-white border-0 text-xs`}
                  >
                    {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(meetup.proposed_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{meetup.proposed_time}</span>
                  </div>
                  {meetup.location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{meetup.location_name}</span>
                    </div>
                  )}
                  {meetup.notes && (
                    <div className="flex items-start gap-2 mt-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{meetup.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {meetup.status === 'pending' && meetup.invitee_id === 'current-user-id' && (
            <div className="bg-muted/30 p-4 md:w-40 flex md:flex-col justify-center gap-2">
              <Button 
                onClick={handleAccept} 
                className="w-full" 
                size="sm"
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Accept
              </Button>
              <Button 
                onClick={handleDecline} 
                variant="outline" 
                className="w-full" 
                size="sm"
              >
                <X className="mr-1 h-4 w-4" />
                Decline
              </Button>
              <Button 
                onClick={handleReschedule} 
                variant="ghost" 
                className="w-full" 
                size="sm"
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Reschedule
              </Button>
            </div>
          )}
          
          {meetup.status === 'confirmed' && (
            <div className="bg-muted/30 p-4 md:w-40 flex md:flex-col items-center justify-center gap-2">
              <Button className="w-full" size="sm">
                Send Message
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                View Details
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MeetupCard;

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
import { motion } from 'framer-motion';

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
      case 'sipped': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAccept = () => {
    toast({
      title: "Meetup accepted",
      description: `You have accepted the meetup with ${person?.first_name} on ${formatDate(meetup.date)}.`,
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="p-0">
          <div className="relative">
            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10">
              <Badge
                variant={
                  meetup.status === 'canceled' ? 'destructive' :
                  meetup.status === 'confirmed' ? 'default' :
                  meetup.status === 'sipped' ? 'default' :
                  'secondary'
                }
                className={`text-xs font-medium px-2.5 py-1 rounded-full shadow-sm ${
                  meetup.status === 'sipped' ? 'bg-green-500 text-white' : 
                  meetup.status === 'pending' ? 'bg-amber-500 text-white' :
                  ''
                }`}
              >
                {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
              </Badge>
            </div>
            
            <MeetupDetailsContent meetup={meetup} />
          </div>
          
          {/* Action buttons - conditionally rendered */}
          {meetup.status === 'pending' && meetup.creator_id !== 'current-user-id' && (
            <div className="flex gap-2 p-4 pt-0">
              <Button 
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" 
                size="sm"
                onClick={handleAccept}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Accept
              </Button>
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white" 
                size="sm"
                onClick={handleDecline}
              >
                <X className="mr-1 h-4 w-4" />
                Decline
              </Button>
            </div>
          )}
          
          {meetup.status === 'confirmed' && (
            <div className="flex p-4 pt-0">
              <Button 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" 
                size="sm"
              >
                <MessageSquare className="mr-1 h-4 w-4" />
                Message
              </Button>
            </div>
          )}
          
          {meetup.status === 'canceled' && (
            <div className="flex p-4 pt-0">
              <Button 
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" 
                size="sm"
                onClick={handleReschedule}
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Reschedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MeetupCard;

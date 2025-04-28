import React from 'react';
import { MeetupType } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, MessageSquare } from 'lucide-react';

interface MeetupDetailsContentProps {
  meetup: MeetupType;
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'canceled':
      return 'bg-red-500';
    case 'completed':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
}

const MeetupDetailsContent: React.FC<MeetupDetailsContentProps> = ({ meetup }) => {
  // Determine which user to display (creator or invitee)
  const person = meetup.invitee || meetup.creator;

  return (
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
    </div>
  );
};

export default MeetupDetailsContent; 
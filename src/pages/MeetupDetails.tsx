import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Coffee, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import MeetupConfirmationIcebreaker from '@/components/icebreaker/MeetupConfirmationIcebreaker';

const MeetupDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meetup, setMeetup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMeetup = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('coffee_meetups')
        .select(`
          *,
          sender:profiles!coffee_meetups_sender_id_fkey(
            id, first_name, last_name, avatar_url, interests, languages, bio, nickname, cultural_insight, location
          ),
          receiver:profiles!coffee_meetups_receiver_id_fkey(
            id, first_name, last_name, avatar_url, interests, languages, bio, nickname, cultural_insight, location
          )
        `)
        .eq('id', id)
        .single();
      if (error) {
        toast.error('Failed to load meetup details');
        setLoading(false);
        return;
      }
      setMeetup(data);
      setLoading(false);
    };
    if (id) fetchMeetup();
  }, [id]);

  if (loading) return <div className="container mx-auto py-8">Loading...</div>;
  if (!meetup) return <div className="container mx-auto py-8">Meetup not found.</div>;

  const otherUser = meetup.sender_id === meetup.sender?.id ? meetup.receiver : meetup.sender;

  return (
    <div className="container mx-auto py-8 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Coffee Meetup Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.first_name} />
              <AvatarFallback>{otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : ''}</h2>
              <Badge className="mt-2 bg-brand-pink text-white">
                {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(meetup.date), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(meetup.date), 'p')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{meetup.location_name}</span>
            </div>
            {meetup.location_lat && meetup.location_lng && (
              <div className="mt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${meetup.location_lat},${meetup.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <MapPin className="h-4 w-4" />
                  Open in Google Maps
                </a>
                <div className="rounded-lg overflow-hidden border w-full max-w-md mt-2">
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${meetup.location_lat},${meetup.location_lng}&zoom=15&size=400x200&markers=color:red%7C${meetup.location_lat},${meetup.location_lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                    alt="Map preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          {meetup.conversation_starter && (
            <div className="mb-4">
              <h3 className="font-semibold">Conversation Starter</h3>
              <p>{meetup.conversation_starter}</p>
            </div>
          )}
          {meetup.additional_notes && (
            <div className="mb-4">
              <h3 className="font-semibold">Additional Notes</h3>
              <p>{meetup.additional_notes}</p>
            </div>
          )}
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Back</Button>
        </CardContent>
      </Card>
      
      {/* Add icebreakers for confirmed and upcoming meetups */}
      {meetup && meetup.status === 'confirmed' && new Date(meetup.date) >= new Date() && (
        <MeetupConfirmationIcebreaker 
          meetup={meetup}
          userA={user}
          userB={otherUser}
        />
      )}
    </div>
  );
};

export default MeetupDetails; 
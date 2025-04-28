import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Calendar, Clock, MapPin, Coffee, MessageSquare } from 'lucide-react';
import { format, isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import NewMeetupSheet from '@/components/meetups/NewMeetupSheet';
import { CoffeeMeetupCalendar } from '@/components/meetups/CoffeeMeetupCalendar';
import MapLocationPicker from '@/components/meetups/MapLocationPicker';
import ScheduleMeetupButton from '@/components/meetups/ScheduleMeetupButton';
import { toast } from 'sonner';
import { CoffeeMeetup, MeetupStatus } from '@/types/coffee-meetup';
import { Profile } from '@/types/auth';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigate } from 'react-router-dom';

type Meetup = CoffeeMeetup;

// Helper to build Google Maps Static Map URL
function getStaticMapUrl(lat: number, lng: number) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x200&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
}

// Helper to build Google Maps Directions link
function getDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// Helper to calculate distance/duration (placeholder)
async function getDistanceDuration(userLat: number, userLng: number, destLat: number, destLng: number) {
  // TODO: Integrate with Google Maps Directions API for real data
  // For now, return placeholder
  return { distance: '2.3 km', duration: '8 min' };
}

// Type guard for language object
function isLanguageObj(lang: any): lang is { id: string } {
  return typeof lang === 'object' && lang !== null && 'id' in lang;
}

const MeetupCard: React.FC<{
  meetup: Meetup;
  cardType: 'pending' | 'received' | 'confirmed' | 'sipped' | 'completed' | 'declined';
  onAccept?: () => void;
  onReject?: () => void;
}> = ({ meetup, cardType, onAccept, onReject }) => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const user = profile;
  // Always show the matched user (the other user, not yourself)
  let otherUser;
  if (meetup.sender_id === user?.id) {
    otherUser = meetup.receiver;
  } else {
    otherUser = meetup.sender;
  }
  const isReceiver = meetup.receiver_id === user?.id;

  // Find common interests
  const commonInterests = Array.isArray(user?.interests) && Array.isArray(otherUser?.interests)
    ? otherUser.interests.filter(interest => user.interests.includes(interest))
    : [];

  // Find common languages
  const userLanguages = Array.isArray(user?.languages) ? user.languages : [];
  const otherUserLanguages = Array.isArray(otherUser?.languages) ? otherUser.languages : [];
  const commonLanguages = userLanguages.length && otherUserLanguages.length
    ? otherUserLanguages.filter(language => {
        if (typeof language === 'string') {
          return userLanguages.some(l => (typeof l === 'string' ? l === language : isLanguageObj(l) && l.id === language));
        } else if (isLanguageObj(language)) {
          return userLanguages.some(l => (typeof l === 'string' ? l === language.id : isLanguageObj(l) && l.id === language.id));
        }
        return false;
      })
    : [];

  // Map preview and distance/duration
  const [distanceInfo, setDistanceInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation && meetup.location_lat && meetup.location_lng) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          getDistanceDuration(pos.coords.latitude, pos.coords.longitude, meetup.location_lat, meetup.location_lng)
            .then(setDistanceInfo);
        },
        () => setUserLocation(null)
      );
    }
  }, [meetup.location_lat, meetup.location_lng]);

  // Handle message button click
  const handleMessageClick = () => {
    navigate(`/chat/${meetup.match_id}`);
  };

  // Unified card layout for all sections
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.avatar_url || ''} />
                <AvatarFallback>
                  {otherUser?.first_name?.[0] || ''}{otherUser?.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {otherUser?.nickname || `${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`}
                </h3>
                <p className="text-sm text-muted-foreground">{meetup.location_name}</p>
              </div>
            </div>
            <Badge variant={
              meetup.status === 'declined' ? 'destructive' :
              meetup.status === 'confirmed' ? 'default' :
              'secondary'
            }>
              {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
            </Badge>
          </div>

          {/* User details */}
          {(Array.isArray(otherUser?.interests) && otherUser.interests.length > 0) && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Interests:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {otherUser.interests.map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {(Array.isArray(otherUser?.languages) && otherUser.languages.length > 0) && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Languages:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {otherUser.languages.map((language, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {typeof language === 'string' ? language : language.id}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {otherUser?.cultural_insight && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Cultural insight:</p>
              <p className="text-sm mt-1">{otherUser.cultural_insight}</p>
            </div>
          )}

          {/* Meetup details */}
          <div className="mt-4 space-y-2">
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
                  href={getDirectionsUrl(meetup.location_lat, meetup.location_lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <MapPin className="h-4 w-4" />
                  Open in Google Maps
                </a>
                <div className="rounded-lg overflow-hidden border w-full max-w-md mt-2">
                  <img
                    src={getStaticMapUrl(meetup.location_lat, meetup.location_lng)}
                    alt="Map preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
                {distanceInfo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{distanceInfo.distance} • {distanceInfo.duration} from your location</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {meetup.conversation_starter && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Conversation Starter:</p>
              <p className="text-sm mt-1">{meetup.conversation_starter}</p>
            </div>
          )}
          {meetup.additional_notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Additional Notes:</p>
              <p className="text-sm mt-1">{meetup.additional_notes}</p>
            </div>
          )}

          {/* Message button for confirmed meetups */}
          {meetup.status === 'confirmed' && (
            <div className="mt-4 flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={handleMessageClick}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          )}
          {/* Accept/Reject buttons for received meetups */}
          {cardType === 'received' && (
            <div className="mt-4 flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={onAccept}
              >
                Accept
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex-1"
                onClick={onReject}
              >
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PopularLocations: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>Popular Locations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
          <MapLocationPicker onLocationSelect={() => {}} />
              </CardContent>
            </Card>
    </motion.div>
  );
};

const Meetups: React.FC = () => {
  const [activeTab, setActiveTab] = useState('confirmed');
  const { user } = useAuth();
  const [isNewMeetupOpen, setIsNewMeetupOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    userId: string;
  } | null>(null);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchedUsers, setMatchedUsers] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coffee_meetups')
        .select(`
          *,
          sender:profiles!coffee_meetups_sender_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            interests,
            languages,
            bio,
            nickname,
            cultural_insight,
            location
          ),
          receiver:profiles!coffee_meetups_receiver_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            interests,
            languages,
            bio,
            nickname,
            cultural_insight,
            location
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeetups(data || []);
    } catch (error) {
      console.error('Error loading meetups:', error);
      toast('Failed to load meetups');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchedUsers = async () => {
    if (!user) return;
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (matchesError) throw matchesError;
      setMatches(matchesData || []);
      const matchedUserIds = (matchesData || []).map(match =>
        match.user1_id === user.id ? match.user2_id : match.user1_id
      );
      if (matchedUserIds.length === 0) {
        setMatchedUsers([]);
        return;
      }
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, interests, bio')
        .in('id', matchedUserIds);
      if (profilesError) throw profilesError;
      setMatchedUsers((profiles || []).map(profile => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        interests: profile.interests || [],
        bio: profile.bio || '',
        languages: [],
        nickname: '',
        cultural_insight: '',
        location: '',
        student_type: null,
        is_verified: false,
        created_at: '',
        updated_at: '',
        university_id: null,
        campus_id: null,
        major_id: null,
        university: null,
        campus: null,
      })));
    } catch (error) {
      console.error('Error loading matched users:', error);
      toast('Failed to load matched users');
    }
  };

  const handleNewMeetup = async (selectedUser = null) => {
    if (matchedUsers.length === 0) {
      toast('You need to have at least one match to schedule a meetup');
      return;
    }
    let userToMeet = selectedUser || matchedUsers[0];
    // Find the match object for this user
    const match = matches.find(
      m => (m.user1_id === user.id && m.user2_id === userToMeet.id) ||
           (m.user2_id === user.id && m.user1_id === userToMeet.id)
    );
    if (!match) {
      toast('No valid match found for this user');
      return;
    }
    setIsNewMeetupOpen(true);
    setSelectedMatch({
      id: match.id,
      first_name: userToMeet.first_name,
      last_name: userToMeet.last_name,
      avatar_url: userToMeet.avatar_url,
      userId: userToMeet.id
    });
  };

  const handleMeetupScheduled = async (meetup: Meetup) => {
    // Show success message with the other user's name
    const otherUser = meetup.sender_id === user?.id ? meetup.receiver : meetup.sender;
    const otherUserName = otherUser?.nickname || `${otherUser?.first_name} ${otherUser?.last_name}`;
    toast.success(`Meetup scheduled successfully with ${otherUserName}!`);

    // Send notification to the other user
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: meetup.receiver_id,
          type: 'meetup',
          content: `You have a new meetup request at ${meetup.location_name} on ${format(new Date(meetup.date), 'PPP')}`,
          related_id: meetup.id,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
        toast.error('Failed to send notification to the other user');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification to the other user');
    }

    // Reload meetups
    loadData();
  };

  const handleAccept = async (meetupId: string, senderId: string) => {
    try {
      const { error } = await supabase
        .from('coffee_meetups')
        .update({ status: 'confirmed' })
        .eq('id', meetupId);
      if (error) throw error;

      // Send notification to sender
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: senderId,
          type: 'meetup',
          content: 'Your meetup request has been confirmed!',
          related_id: meetupId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error sending confirmation notification:', notificationError);
        toast.error('Failed to send confirmation notification');
      } else {
        toast.success('Meetup confirmed successfully!');
      }

      loadData();
    } catch (error) {
      console.error('Error accepting meetup:', error);
      toast.error('Failed to confirm meetup');
    }
  };

  const handleReject = async (meetupId: string) => {
    try {
      const { error } = await supabase
        .from('coffee_meetups')
        .update({ status: 'declined' })
        .eq('id', meetupId);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error rejecting meetup:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadMatchedUsers();
  }, [user]);

  // Split meetups into sections
  const pendingMeetups = meetups.filter(m => m.status === 'pending' && m.sender_id === user?.id);
  const receivedMeetups = meetups.filter(m => m.status === 'pending' && m.receiver_id === user?.id);
  const confirmedMeetups = meetups.filter(m => m.status === 'confirmed' && !isBefore(new Date(m.date), startOfToday()) && (m.sender_id === user?.id || m.receiver_id === user?.id));
  const completedMeetups = meetups.filter(m => m.status === 'completed' as MeetupStatus && isBefore(new Date(m.date), startOfToday()) && (m.sender_id === user?.id || m.receiver_id === user?.id));
  const sippedMeetups = meetups
    .filter(m => m.status === 'confirmed' && isBefore(new Date(m.date), startOfToday()) && (m.sender_id === user?.id || m.receiver_id === user?.id))
    .map(m => ({ ...m, status: 'sipped' as MeetupStatus }));
  const declinedMeetups = meetups.filter(m => m.status === 'declined' && (m.sender_id === user?.id || m.receiver_id === user?.id));

  // Filter confirmed meetups for calendar
  const confirmedMeetupsForCalendar = meetups.filter(m => m.status === 'confirmed');

  // Update calendar meetups to include both confirmed and sipped
  const calendarMeetups = meetups.filter(m => (m.status === 'confirmed' || m.status === 'sipped'));

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Coffee className="h-6 w-6" />
          Coffee Meetups
        </h1>
        <ScheduleMeetupButton onClick={() => handleNewMeetup()} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CoffeeMeetupCalendar
                meetups={calendarMeetups}
                onDateSelect={() => {}}
              />
            </CardContent>
          </Card>
          <PopularLocations />
        </div>
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="sipped">Sipped</TabsTrigger>
              <TabsTrigger value="declined">Declined</TabsTrigger>
            </TabsList>
            <AnimatePresence>
              <TabsContent key="confirmed" value="confirmed" className="space-y-4">
                {confirmedMeetups.length === 0 ? (
                  <motion.div
                    key="confirmed-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Coffee className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No confirmed meetups</p>
                  </motion.div>
                ) : (
                  confirmedMeetups.map((meetup) => (
                    <MeetupCard
                      key={`confirmed-${meetup.id}`}
                      meetup={meetup}
                      cardType="confirmed"
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent key="pending" value="pending" className="space-y-4">
                {pendingMeetups.length === 0 ? (
                  <motion.div
                    key="pending-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Coffee className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No pending meetups</p>
                  </motion.div>
                ) : (
                  pendingMeetups.map((meetup) => (
                    <MeetupCard
                      key={`pending-${meetup.id}`}
                      meetup={meetup}
                      cardType="pending"
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent key="received" value="received" className="space-y-4">
                {receivedMeetups.length === 0 ? (
                  <motion.div
                    key="received-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Coffee className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No received meetups</p>
                  </motion.div>
                ) : (
                  receivedMeetups.map((meetup) => (
                    <MeetupCard
                      key={`received-${meetup.id}`}
                      meetup={meetup}
                      cardType="received"
                      onAccept={() => handleAccept(meetup.id, meetup.sender_id)}
                      onReject={() => handleReject(meetup.id)}
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent key="sipped" value="sipped" className="space-y-4">
                {sippedMeetups.length === 0 ? (
                  <motion.div
                    key="sipped-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Coffee className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No sipped meetups</p>
                  </motion.div>
                ) : (
                  sippedMeetups.map((meetup) => (
                    <MeetupCard
                      key={`sipped-${meetup.id}`}
                      meetup={meetup}
                      cardType="sipped"
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent key="declined" value="declined" className="space-y-4">
                {declinedMeetups.length === 0 ? (
                  <motion.div
                    key="declined-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Coffee className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No declined meetups</p>
                  </motion.div>
                ) : (
                  declinedMeetups.map((meetup) => (
                    <MeetupCard
                      key={`declined-${meetup.id}`}
                      meetup={meetup}
                      cardType="declined"
                    />
                  ))
                )}
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
      <NewMeetupSheet
        matchId={selectedMatch?.id || ''}
        selectedUser={{
          id: selectedMatch?.userId || '',
          first_name: selectedMatch?.first_name || '',
          last_name: selectedMatch?.last_name || ''
        }}
        onClose={() => {
          setIsNewMeetupOpen(false);
          setSelectedMatch(null);
          loadData();
        }}
        onSuccess={handleMeetupScheduled}
        isOpen={isNewMeetupOpen}
      />
    </div>
  );
};

export default Meetups;


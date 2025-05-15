import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ClubMeetup, MeetupRSVPStatus } from '@/types/clubs';
import { motion } from 'framer-motion';
import CalendarButtons from '@/components/calendar/CalendarButtons';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Icons
import { 
  Calendar, 
  MapPin, 
  ArrowLeft, 
  MoreVertical, 
  Edit, 
  Trash2,
  Check,
  X,
  HelpCircle,
  Users
} from 'lucide-react';

interface UserProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
}

const ClubMeetupDetailPage = () => {
  const { clubId, meetupId } = useParams<{ clubId: string; meetupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [meetup, setMeetup] = useState<ClubMeetup | null>(null);
  const [attendees, setAttendees] = useState<{
    user_id: string;
    status: MeetupRSVPStatus;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  }[]>([]);
  const [userRsvpStatus, setUserRsvpStatus] = useState<MeetupRSVPStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user profile and meetup details
  useEffect(() => {
    if (!clubId || !meetupId || !user) return;
    
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        setUserProfile(data);
      }
    };
    
    fetchUserProfile();
    
    const fetchMeetupDetails = async () => {
      try {
        setLoading(true);
        
        // Check if user is club admin
        const { data: membershipData, error: membershipError } = await supabase
          .from('club_memberships')
          .select('role')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .single();
          
        if (!membershipError) {
          setIsAdmin(membershipData.role === 'admin');
        }
        
        // Get meetup details
        const { data: meetupData, error: meetupError } = await supabase
          .from('club_meetups')
          .select(`
            id, 
            club_id, 
            title, 
            description, 
            date, 
            time, 
            location_name, 
            location_address,
            location_lat,
            location_lng,
            created_by,
            created_at
          `)
          .eq('id', meetupId)
          .single();
          
        if (meetupError) throw meetupError;
        
        // Get creator info separately to avoid relationship ambiguity
        const { data: creatorData, error: creatorError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', meetupData.created_by)
          .single();
        
        if (creatorError) {
          console.error('Error fetching creator data:', creatorError);
        }
        
        // Combine the data
        const completeData = {
          ...meetupData,
          creator: creatorError ? undefined : {
            first_name: creatorData.first_name,
            last_name: creatorData.last_name,
            avatar_url: creatorData.avatar_url
          }
        };
        
        setMeetup(completeData as ClubMeetup);
        
        // Get RSVPs
        const { data: rsvpData, error: rsvpError } = await supabase
          .from('club_meetup_rsvps')
          .select(`
            user_id, 
            status,
            profiles:profiles(first_name, last_name, avatar_url)
          `)
          .eq('meetup_id', meetupId);
          
        if (rsvpError) throw rsvpError;
        
        // Format attendees data
        const formattedAttendees = rsvpData.map(rsvp => ({
          user_id: rsvp.user_id,
          status: rsvp.status as MeetupRSVPStatus,
          first_name: rsvp.profiles.first_name,
          last_name: rsvp.profiles.last_name,
          avatar_url: rsvp.profiles.avatar_url
        }));
        
        setAttendees(formattedAttendees);
        
        // Check if current user has RSVPed
        const userRsvp = rsvpData.find(rsvp => rsvp.user_id === user.id);
        if (userRsvp) {
          setUserRsvpStatus(userRsvp.status as MeetupRSVPStatus);
        }
      } catch (err) {
        console.error('Error fetching meetup details:', err);
        toast.error('Failed to load meetup details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeetupDetails();
  }, [clubId, meetupId, user]);
  
  // Handle RSVP
  const handleRsvp = async (status: MeetupRSVPStatus) => {
    if (!meetup || !user || !userProfile) return;
    
    try {
      const { error } = await supabase
        .from('club_meetup_rsvps')
        .upsert({
          meetup_id: meetup.id,
          user_id: user.id,
          status: status,
          responded_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      // Update local state
      setUserRsvpStatus(status);
      
      // Update attendees list
      setAttendees(current => {
        const existingAttendeeIndex = current.findIndex(a => a.user_id === user.id);
        
        if (existingAttendeeIndex >= 0) {
          // Update existing attendee
          const updated = [...current];
          updated[existingAttendeeIndex].status = status;
          return updated;
        } else {
          // Add new attendee
          return [...current, {
            user_id: user.id,
            status: status,
            first_name: userProfile.first_name || '',
            last_name: userProfile.last_name || '',
            avatar_url: userProfile.avatar_url || null
          }];
        }
      });
      
      toast.success(`You've ${status === 'yes' ? 'accepted' : (status === 'no' ? 'declined' : 'tentatively accepted')} this meetup`);
    } catch (err) {
      console.error('Error updating RSVP:', err);
      toast.error('Failed to update your RSVP');
    }
  };
  
  // Delete meetup (admin only)
  const handleDeleteMeetup = async () => {
    if (!meetup || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('club_meetups')
        .delete()
        .eq('id', meetup.id);
        
      if (error) throw error;
      
      toast.success('Meetup deleted successfully');
      navigate(`/clubs/${clubId}`);
    } catch (err) {
      console.error('Error deleting meetup:', err);
      toast.error('Failed to delete meetup');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-60" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!meetup) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Meetup Not Found</h1>
        <p className="text-muted-foreground mb-6">This meetup either doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate(`/clubs/${clubId}`)}>Return to Club</Button>
      </div>
    );
  }

  // Count RSVPs by status
  const yesCount = attendees.filter(a => a.status === 'yes').length;
  const maybeCount = attendees.filter(a => a.status === 'maybe').length;
  const noCount = attendees.filter(a => a.status === 'no').length;
  const pendingCount = attendees.filter(a => a.status === 'pending').length;
  
  // Format date and time
  const formattedDate = new Date(meetup.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Helper function to get badge variant based on RSVP status
  const getBadgeVariant = (status: MeetupRSVPStatus) => {
    switch (status) {
      case 'yes':
        return 'default';
      case 'maybe':
        return 'secondary';
      case 'no':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Helper function to get badge text based on RSVP status
  const getBadgeText = (status: MeetupRSVPStatus) => {
    switch (status) {
      case 'yes':
        return 'Going';
      case 'maybe':
        return 'Maybe';
      case 'no':
        return 'Not Going';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center text-muted-foreground"
          onClick={() => navigate(`/clubs/${clubId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Club
        </Button>
        
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/clubs/${clubId}/meetups/${meetupId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Meetup
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500" 
                onClick={handleDeleteMeetup}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Meetup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{meetup.title}</h1>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formattedDate}</span>
              {meetup.time && <span className="ml-1"> at {meetup.time}</span>}
            </div>
          </div>
          
          {/* Add Calendar Buttons */}
          <div className="mt-4">
            <CalendarButtons
              title={meetup.title}
              description={meetup.description || ''}
              location={`${meetup.location_name}${meetup.location_address ? `, ${meetup.location_address}` : ''}`}
              date={meetup.date}
              time={meetup.time || '00:00'}
              durationMinutes={meetup.duration_minutes || 60}
              variant="compact"
            />
          </div>
          
          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {meetup.description || "No description provided."}
              </p>
              
              {meetup.location_name && (
                <div className="mt-6">
                  <h3 className="font-medium flex items-center mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </h3>
                  <p className="font-medium">{meetup.location_name}</p>
                  {meetup.location_address && (
                    <p className="text-muted-foreground">{meetup.location_address}</p>
                  )}
                  
                  {/* Map would go here if needed */}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Attendees Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Attendees ({attendees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4 space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{yesCount}</div>
                  <div className="text-sm text-muted-foreground">Going</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">{maybeCount}</div>
                  <div className="text-sm text-muted-foreground">Maybe</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{noCount}</div>
                  <div className="text-sm text-muted-foreground">Not Going</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">{pendingCount}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                {attendees.map((attendee) => (
                  <div key={attendee.user_id} className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={attendee.avatar_url || ''} />
                      <AvatarFallback>
                        {attendee.first_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {attendee.first_name} {attendee.last_name}
                        {attendee.user_id === user?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                      </p>
                    </div>
                    <Badge variant={getBadgeVariant(attendee.status)}>
                      {getBadgeText(attendee.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* RSVP and Organizer Card */}
        <div className="space-y-6">
          {/* RSVP Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your RSVP</CardTitle>
              <CardDescription>
                Let the organizer know if you're attending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant={userRsvpStatus === 'yes' ? 'default' : 'outline'} 
                className={`w-full justify-start ${userRsvpStatus === 'yes' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                onClick={() => handleRsvp('yes')}
              >
                <Check className="h-4 w-4 mr-2" />
                Yes, I'll be there
              </Button>
              
              <Button 
                variant={userRsvpStatus === 'maybe' ? 'default' : 'outline'} 
                className={`w-full justify-start ${userRsvpStatus === 'maybe' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                onClick={() => handleRsvp('maybe')}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Maybe
              </Button>
              
              <Button 
                variant={userRsvpStatus === 'no' ? 'default' : 'outline'} 
                className={`w-full justify-start ${userRsvpStatus === 'no' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                onClick={() => handleRsvp('no')}
              >
                <X className="h-4 w-4 mr-2" />
                No, I can't make it
              </Button>
            </CardContent>
          </Card>
          
          {/* Organizer Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={meetup.creator?.avatar_url || ''} />
                  <AvatarFallback>
                    {meetup.creator?.first_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {meetup.creator?.first_name} {meetup.creator?.last_name}
                    {meetup.created_by === user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Organizer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClubMeetupDetailPage; 
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowRight, Calendar, Coffee, MessageSquare, Bell, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { UniversityType, MajorType } from '@/types/database';
import type { Conversation } from './MessagesPage';
import GlobalMatchCard from '@/components/matches/GlobalMatchCard';
import MatchCard from '@/components/matches/MatchCard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewProfile, setViewProfile] = useState('student');
  const [suggestedMatches, setSuggestedMatches] = useState([]);
  const [upcomingMeetups, setUpcomingMeetups] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [universities, setUniversities] = useState<UniversityType[]>([]);
  const [majors, setMajors] = useState<MajorType[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [meetupsCount, setMeetupsCount] = useState(0);
  const [allMeetups, setAllMeetups] = useState([]);
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all profiles for lookup
        const { data: allProfiles } = await supabase.from('profiles').select('*');
        setProfiles(allProfiles || []);

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Fetch languages and interests for MatchCard
        const { data: languagesData } = await supabase.from('languages').select('id, name');
        if (languagesData && Array.isArray(languagesData)) setLanguages(languagesData);
        const { data: interestsData } = await supabase.from('interests').select('id, name');
        if (interestsData && Array.isArray(interestsData)) setInterests(interestsData);

        // Fetch latest 3 accepted matches (by updated_at desc)
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .order('updated_at', { ascending: false })
          .limit(3);
        if (matchesError) throw matchesError;
        // Get all user IDs involved
        const userIds = Array.from(new Set((matchesData || []).flatMap(m => [m.user1_id, m.user2_id])));
        // Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        if (profilesError) throw profilesError;
        // Map profiles by id
        const profileMap = {};
        (profilesData || []).forEach(p => { profileMap[p.id] = p; });
        // Compose match cards data
        const latestMatches = (matchesData || []).map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const otherProfile = profileMap[otherUserId];
          
          // Add match_score if it doesn't exist (default: 75%)
          return {
            ...match,
            otherUser: {
              ...otherProfile,
              // Use existing match score from profile or match object if available, otherwise default to 75
              match_score: otherProfile?.match_score || 75
            }
          };
        });
        setSuggestedMatches(latestMatches);
        setConnectionsCount((matchesData || []).length);

        // --- FETCH MEETUPS LIKE MEETUPS PAGE ---
        const { data: meetupsData, error: meetupsError } = await supabase
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
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        if (meetupsError) throw meetupsError;
        setAllMeetups(meetupsData || []);
        // Only future and confirmed meetups
        const now = new Date();
        const upcoming = (meetupsData || []).filter(m => m.status === 'confirmed' && new Date(m.date) >= now);
        setUpcomingMeetups(upcoming);
        setMeetupsCount(upcoming.length);

        // Fetch recent conversations (last 3, most recently updated)
        const { data: convs, error: convsError } = await supabase
          .from('conversations')
          .select('id, match_id, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(3);
        if (convsError) throw convsError;
        if (convs && convs.length > 0) {
          // Fetch matches for these conversations
          const matchIds = convs.map((c: any) => c.match_id);
          const { data: matches, error: matchError } = await supabase
            .from('matches')
            .select('id, user1_id, user2_id')
            .in('id', matchIds);
          if (matchError) throw matchError;
          // Collect all other user IDs
          const otherUserIds = matches
            .map((m: any) => (m.user1_id === user.id ? m.user2_id : m.user1_id));
          // Fetch all needed profiles
          const { data: profilesData, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', otherUserIds);
          if (profileError) throw profileError;
          const profileMap = new Map();
          (profilesData || []).forEach((p: any) => profileMap.set(p.id, p));
          // Fetch last message for each conversation
          const chatList: Conversation[] = await Promise.all(convs.map(async (c: any) => {
            const match = matches.find((m: any) => m.id === c.match_id);
            if (!match) return null;
            const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
            // Fetch last message for this conversation
            const { data: lastMsgData } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', c.id)
              .order('created_at', { ascending: false })
              .limit(1);
            const lastMsg = lastMsgData && lastMsgData[0];
            return {
              id: c.id,
              other_user: profileMap.get(otherId) || { id: otherId, first_name: '', last_name: '', avatar_url: '' },
              last_message: lastMsg ? lastMsg.content : '',
              last_message_time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            };
          }));
          setRecentChats(chatList.filter(Boolean));
        } else {
          setRecentChats([]);
        }

        // Fetch notifications (last 3)
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        setNotifications(notificationsData || []);

        // Fetch universities and majors for mapping (skip if types do not match)
        const { data: universitiesData } = await supabase.from('universities').select('*');
        if (universitiesData && Array.isArray(universitiesData)) setUniversities(universitiesData);
        const { data: majorsData } = await supabase.from('majors').select('*');
        if (majorsData && Array.isArray(majorsData)) setMajors(majorsData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user]);

  const handleConnect = (id) => {
    toast.success(`Connection request sent to user #${id}`);
  };

  const handleMessage = (id) => {
    toast.success(`Started conversation with user #${id}`);
  };

  const handleAcceptMeetup = async (meetupId, senderId) => {
    try {
      const { error } = await supabase
        .from('coffee_meetups')
        .update({ status: 'confirmed' })
        .eq('id', meetupId);
      if (error) throw error;
      // Send notification to sender
      await supabase.from('notifications').insert({
        user_id: senderId,
        type: 'meetup',
        content: 'Your meetup request has been confirmed!',
        related_id: meetupId,
        is_read: false,
        created_at: new Date().toISOString()
      });
      toast.success('Meetup confirmed successfully!');
      // Refresh meetups
      const { data: meetupsData } = await supabase
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
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      setAllMeetups(meetupsData || []);
      const now = new Date();
      const upcoming = (meetupsData || []).filter(m => m.status === 'confirmed' && new Date(m.date) >= now);
      setUpcomingMeetups(upcoming);
      setMeetupsCount(upcoming.length);
    } catch (error) {
      toast.error('Failed to confirm meetup');
    }
  };

  // Utility to map a match to ProfileCard props (like in Matches page)
  function mapMatchToProfileCard(match, universities, majors) {
    const other = match.user1_id === user.id ? {
      id: match.user2_id,
      first_name: match.user2_first_name,
      last_name: match.user2_last_name,
      avatar_url: match.user2_avatar_url,
      university: match.user2_university,
      major: match.user2_major,
      student_type: match.user2_student_type,
      bio: match.user2_bio,
      nationality: match.user2_nationality,
      is_verified: match.user2_is_verified,
      match_score: match.match_score,
    } : {
      id: match.user1_id,
      first_name: match.user1_first_name,
      last_name: match.user1_last_name,
      avatar_url: match.user1_avatar_url,
      university: match.user1_university,
      major: match.user1_major,
      student_type: match.user1_student_type,
      bio: match.user1_bio,
      nationality: match.user1_nationality,
      is_verified: match.user1_is_verified,
      match_score: match.match_score,
    };
    const university = universities.find(u => u.id === other.university)?.name || other.university || '';
    const major = majors.find(m => m.id === other.major)?.name || other.major || '';
    const studentType: 'international' | 'local' = other.student_type === 'international' ? 'international' : 'local';
    return {
      id: other.id,
      name: `${other.first_name} ${other.last_name}`,
      avatar: other.avatar_url,
      university,
      major,
      studentType,
      interests: [], // Add if available
      languages: [], // Add if available
      bio: other.bio || '',
      matchPercentage: other.match_score
    };
  }

  // Utility to map current user profile to ProfileCard props
  function mapProfileToProfileCard(profile, universities, majors) {
    const university = universities.find(u => u.id === profile.university_id)?.name || profile.university_id || '';
    const major = majors.find(m => m.id === profile.major_id)?.name || profile.major_id || '';
    const studentType = profile.student_type === 'international' ? 'international' : 'local';
    return {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      avatar: profile.avatar_url,
      university,
      major,
      studentType,
      interests: profile.interests || [],
      languages: (profile.languages || []).map(l => l.id),
      bio: profile.bio || '',
      matchPercentage: undefined
    };
  }

  // Add this new function to create a user match preview object
  function createUserProfilePreview(profile: any) {
    if (!profile) return null;
    
    return {
      id: 'self-preview',
      otherUser: {
        ...profile,
        id: profile.id,
        match_score: 100, // Perfect match with yourself!
      }
    };
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="col-span-1 md:col-span-2">
          {/* Welcome Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.first_name || 'Student'}!</h2>
                  <p className="text-gray-600">
                    You have <span className="font-semibold">{suggestedMatches.length} new matches</span> and <span className="font-semibold">{upcomingMeetups.length} upcoming coffee meetups</span> this week.
                  </p>
                </div>
                <div>
                  <Tabs defaultValue={viewProfile} onValueChange={setViewProfile} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="student">Student</TabsTrigger>
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Conditional Content Based on Tab Selection */}
          {viewProfile === 'student' ? (
            <>
              {/* Latest Matches - Show in Student view */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Latest Matches</h2>
              <Link to="/matches">
                <Button variant="ghost" className="text-brand-purple">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedMatches.length === 0 ? (
                <div className="text-center text-gray-500 py-4 col-span-3">No recent matches</div>
              ) : (
                suggestedMatches.map(match => (
                      <GlobalMatchCard
                    key={match.id}
                        userId={match.otherUser.id}
                        matchId={match.id}
                        match_score={match.otherUser.match_score}
                        isMatched={true}
                        onAccept={() => Promise.resolve()}
                        onReject={() => Promise.resolve()}
                    onMessage={() => navigate(`/messages?conversationId=${match.id}`)}
                  />
                ))
              )}
            </div>
            <div className="mt-6 text-center">
              <Link to="/matches">
                <Button className="bg-brand-purple hover:bg-brand-dark">
                  See All Matches
                </Button>
              </Link>
            </div>
          </div>
              {/* Coffee Meetups - Show in Student view */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Coffee Meetups</CardTitle>
                <Link to="/meetups">
                  <Button variant="ghost" className="text-brand-purple">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Your scheduled and received meetups</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Confirmed Meetups */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Upcoming Confirmed Meetups</h3>
                {allMeetups.filter(m => m.status === 'confirmed' && new Date(m.date) >= new Date()).length > 0 ? (
                  <div className="space-y-4">
                    {allMeetups.filter(m => m.status === 'confirmed' && new Date(m.date) >= new Date()).map(meetup => {
                      let otherUser = meetup.sender_id === user.id ? meetup.receiver : meetup.sender;
                      return (
                        <div key={meetup.id} className="flex items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0 mr-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.first_name} />
                              <AvatarFallback>{otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center">
                              <p className="font-medium">{otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : ''}</p>
                              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                Confirmed
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{meetup.date}</span>
                              </div>
                              <div className="flex items-center mt-1">
                                <Coffee className="h-3 w-3 mr-1" />
                                <span>{meetup.location_name}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Link to={`/meetups/${meetup.id}`}><Button size="sm" variant="outline">View Details</Button></Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No upcoming confirmed meetups</div>
                )}
              </div>
              {/* Received Meetups */}
              <div>
                <h3 className="font-semibold mb-2">Received Meetups (Pending)</h3>
                {allMeetups.filter(m => m.status === 'pending' && m.receiver_id === user.id && new Date(m.date) >= new Date()).length > 0 ? (
                  <div className="space-y-4">
                    {allMeetups.filter(m => m.status === 'pending' && m.receiver_id === user.id && new Date(m.date) >= new Date()).map(meetup => {
                      let otherUser = meetup.sender_id === user.id ? meetup.receiver : meetup.sender;
                      return (
                        <div key={meetup.id} className="flex items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0 mr-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.first_name} />
                              <AvatarFallback>{otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center">
                              <p className="font-medium">{otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : ''}</p>
                              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                                Pending
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{meetup.date}</span>
                              </div>
                              <div className="flex items-center mt-1">
                                <Coffee className="h-3 w-3 mr-1" />
                                <span>{meetup.location_name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="default" onClick={() => handleAcceptMeetup(meetup.id, meetup.sender_id)}>Accept</Button>
                            <Link to={`/meetups/${meetup.id}`}><Button size="sm" variant="outline">View Details</Button></Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No received meetups</div>
                )}
              </div>
            </CardContent>
          </Card>
            </>
          ) : (
            <>
              {/* Profile Card - Show in Profile view */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>How Others See Your Profile</CardTitle>
                  <CardDescription>This is how your profile appears to other students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    {profile && (
                      <div className="max-w-sm">
                        <GlobalMatchCard
                          userId={profile.id}
                          match_score={100}
                          isMatched={true}
                          onAccept={() => Promise.resolve()}
                          onReject={() => Promise.resolve()}
                          showActions={false}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-6 text-center">
                    <Link to="/profile">
                      <Button className="bg-brand-purple hover:bg-brand-dark">
                        Edit Your Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        {/* Right Column */}
        <div className="col-span-1">
          {/* Profile Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md mb-4">
                  <img 
                    src={profile?.avatar_url || ''} 
                    alt="Your Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-xl">{profile?.first_name} {profile?.last_name}</h3>
                <p className="text-gray-500">
                  {universities.find(u => u.id === profile?.university_id)?.name || ''} • {majors.find(m => m.id === profile?.major_id)?.name || ''}
                </p>
                <Badge className="mt-2 bg-brand-pink text-white">
                  {profile?.student_type === 'international' ? 'International Student' : 'Local Student'}
                </Badge>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-brand-purple">{connectionsCount}</p>
                    <p className="text-sm text-gray-500">Connections</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brand-purple">{meetupsCount}</p>
                    <p className="text-sm text-gray-500">Meetups</p>
                  </div>
                </div>
                <Link to="/profile">
                  <Button variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          {/* Recent Messages */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Messages</CardTitle>
                <Link to="/messages">
                  <Button variant="ghost" className="text-brand-purple">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Stay in touch with your connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentChats.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No recent chats</div>
                ) : (
                  recentChats.map(conv => (
                    <Link to="/messages" key={conv.id} className="block">
                      <div className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex-shrink-0 mr-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conv.other_user.avatar_url || '/default-avatar.png'} alt={conv.other_user.first_name} />
                            <AvatarFallback>{conv.other_user.first_name?.[0]}{conv.other_user.last_name?.[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-[#1E293B] truncate">
                              {conv.other_user.first_name} {conv.other_user.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {conv.last_message_time}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conv.last_message || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="mt-4">
                <Link to="/messages">
                  <Button className="w-full bg-brand-purple hover:bg-brand-dark">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notif, idx) => (
                  <div className="flex items-start" key={idx}>
                    <div className="bg-brand-light p-2 rounded-full mr-3">
                      <Bell className="h-4 w-4 text-brand-purple" />
                    </div>
                    <div>
                      <p className="text-sm">
                        {notif.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notif.created_at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StudentProfileCard from '@/components/profile/StudentProfileCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowRight, Calendar, Coffee, MessageSquare, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { UniversityType, MajorType } from '@/types/database';

const Dashboard = () => {
  const { user } = useAuth();
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

        // Fetch suggested matches (top 3 by match_score)
        const { data: matchesData } = await supabase
          .from('matches_with_profiles')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('match_score', { ascending: false })
          .limit(3);
        setSuggestedMatches(matchesData || []);

        // Fetch upcoming meetups
        const { data: meetupsData } = await supabase
          .from('coffee_meetups')
          .select('*')
          .or(`creator_id.eq.${user.id},invitee_id.eq.${user.id}`)
          .order('proposed_date', { ascending: true })
          .limit(3);
        setUpcomingMeetups(meetupsData || []);

        // Fetch recent messages (last 3 conversations)
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        setRecentMessages(messagesData || []);

        // Fetch notifications (last 3)
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        setNotifications(notificationsData || []);

        // Fetch universities and majors for mapping
        const { data: universitiesData } = await supabase.from('universities').select('id, name');
        setUniversities(universitiesData || []);
        const { data: majorsData } = await supabase.from('majors').select('id, name');
        setMajors(majorsData || []);
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
    const studentType = other.student_type === 'international' ? 'international' : 'local';
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

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading dashboard...</div>;
  }

  return (
    <MainLayout>
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
            {/* Suggested Matches */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Suggested Matches</h2>
                <Link to="/discover">
                  <Button variant="ghost" className="text-brand-purple">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedMatches.map(match => (
                  <ProfileCard
                    key={match.id}
                    profile={mapMatchToProfileCard(match, universities, majors)}
                    onConnect={() => handleConnect(match.id)}
                    onMessage={() => handleMessage(match.id)}
                  />
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link to="/discover">
                  <Button className="bg-brand-purple hover:bg-brand-dark">
                    Discover More Students
                  </Button>
                </Link>
              </div>
            </div>
            {/* Coffee Meetups */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Coffee Meetups</CardTitle>
                  <Link to="/meetups">
                    <Button variant="ghost" className="text-brand-purple">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>Your scheduled meetups with other students</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingMeetups.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMeetups.map(meetup => {
                      const otherUserId = meetup.creator_id === user.id ? meetup.invitee_id : meetup.creator_id;
                      const otherUserProfile = profiles.find(p => p.id === otherUserId);
                      return (
                        <div key={meetup.id} className="flex items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0 mr-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUserProfile?.avatar_url} alt={otherUserProfile?.first_name} />
                              <AvatarFallback>{otherUserProfile?.first_name?.[0]}{otherUserProfile?.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center">
                              <p className="font-medium">{otherUserProfile ? `${otherUserProfile.first_name} ${otherUserProfile.last_name}` : ''}</p>
                              {meetup.confirmed ? (
                                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                  Confirmed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                                  Awaiting Confirmation
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{meetup.proposed_date} at {meetup.proposed_time}</span>
                              </div>
                              <div className="flex items-center mt-1">
                                <Coffee className="h-3 w-3 mr-1" />
                                <span>{meetup.location_name}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Button size="sm" variant={meetup.confirmed ? 'outline' : 'default'} className={meetup.confirmed ? '' : 'bg-brand-purple hover:bg-brand-dark'}>
                              {meetup.confirmed ? 'View Details' : 'Confirm'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coffee className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No upcoming meetups</h3>
                    <p className="text-gray-500 mb-4">
                      Connect with students and schedule your first coffee meetup
                    </p>
                    <Button className="bg-brand-purple hover:bg-brand-dark">
                      Schedule a Meetup
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <p className="text-2xl font-bold text-brand-purple">12</p>
                      <p className="text-sm text-gray-500">Connections</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-brand-purple">5</p>
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
                  {recentMessages.map(message => {
                    const senderProfile = profiles.find(p => p.id === message.sender_id);
                    return (
                      <div 
                        key={message.id} 
                        className={`flex items-center p-3 rounded-lg cursor-pointer ${
                          message.unread ? 'bg-brand-purple/5' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-shrink-0 mr-3 relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={senderProfile?.avatar_url} alt={senderProfile?.first_name} />
                            <AvatarFallback>{senderProfile?.first_name?.[0]}{senderProfile?.last_name?.[0]}</AvatarFallback>
                          </Avatar>
                          {message.unread && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-purple rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <div className="flex justify-between items-center">
                            <p className={`font-medium ${message.unread ? 'text-brand-purple' : ''}`}>
                              {senderProfile ? `${senderProfile.first_name} ${senderProfile.last_name}` : ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              {message.time || ''}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {message.preview || ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
    </MainLayout>
  );
};

export default Dashboard; 
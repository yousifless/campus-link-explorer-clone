
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { EnhancedProfileCard } from '@/components/profile/EnhancedProfileCard';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Coffee,
  MessageSquare,
  Bell,
  Calendar,
  ArrowRight,
  Search,
  Heart,
  MapPin,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [loading, setLoading] = useState(true);
  const [recentMatches, setRecentMatches] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [upcomingMeetups, setUpcomingMeetups] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  
  // Reference data
  const [universities, setUniversities] = useState([]);
  const [majors, setMajors] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [interests, setInterests] = useState([]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // 1. Fetch reference data
        const [univData, majorData, langData, intData] = await Promise.all([
          supabase.from('universities').select('id, name'),
          supabase.from('majors').select('id, name'),
          supabase.from('languages').select('id, name'),
          supabase.from('interests').select('id, name')
        ]);
        
        setUniversities(univData.data || []);
        setMajors(majorData.data || []);
        setLanguages(langData.data || []);
        setInterests(intData.data || []);

        // 2. Fetch recent matches (both pending and accepted)
        const { data: matchesData } = await supabase
          .from('matches')
          .select(`
            id, 
            status, 
            user1_id,
            user2_id,
            created_at,
            profiles!matches_user1_id_fkey (
              id, first_name, last_name, avatar_url, university_id, major_id, 
              student_type, bio, nationality, interests, languages
            ),
            profiles!matches_user2_id_fkey (
              id, first_name, last_name, avatar_url, university_id, major_id, 
              student_type, bio, nationality, interests, languages
            )
          `)
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (matchesData) {
          // Process match data to determine which profile is the "other user"
          const processedMatches = matchesData.map(match => {
            // Determine if the current user is user1 or user2
            const isUser1 = match.user1_id === user.id;
            
            // Get the other user's profile
            const otherUser = isUser1 ? match.profiles.profiles_matches_user2_id_fkey : match.profiles.profiles_matches_user1_id_fkey;
            
            // Format languages and interests (handle arrays or objects)
            if (otherUser) {
              // Add match score (for demo purposes - in real app would come from matching algorithm)
              const randomScore = Math.floor(Math.random() * 30) + 70; // 70-100%
              otherUser.match_score = randomScore;
            }
            
            // Create a processed match object with needed data
            return {
              id: match.id,
              status: match.status,
              created_at: match.created_at,
              otherUser
            };
          });
          
          // Set recent matches (accepted)
          setRecentMatches(processedMatches.filter(m => m.status === 'accepted').slice(0, 3));
          
          // Set pending matches
          setPendingMatches(processedMatches.filter(m => m.status === 'pending').slice(0, 3));
        }

        // 3. Fetch recent messages
        const { data: conversationsData } = await supabase
          .from('conversations')
          .select(`
            id,
            match_id,
            created_at,
            messages (
              id, content, sender_id, created_at, is_read
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (conversationsData) {
          // Get the most recent message for each conversation
          const conversationsWithLastMessage = conversationsData
            .filter(conv => conv.messages && conv.messages.length > 0)
            .map(conv => {
              // Sort messages by date (newest first)
              const sortedMessages = [...conv.messages].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              
              // Return conversation with just the latest message
              return {
                ...conv,
                last_message: sortedMessages[0]
              };
            });

          setRecentMessages(conversationsWithLastMessage);
        }

        // 4. Fetch upcoming meetups
        const { data: meetupsData } = await supabase
          .from('coffee_meetups')
          .select(`
            id, 
            location_name,
            date,
            status,
            sender_id, 
            receiver_id,
            match_id
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'confirmed')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(3);

        if (meetupsData) {
          setUpcomingMeetups(meetupsData);
        }

        // 5. Fetch unread notifications
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notificationsData) {
          setUnreadNotifications(notificationsData);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Format data for profile cards
  const formatProfileData = (match) => {
    if (!match?.otherUser) return null;
    
    const other = match.otherUser;
    const university = universities.find(u => u.id === other.university_id)?.name || '';
    const major = majors.find(m => m.id === other.major_id)?.name || '';
    
    // Handle languages
    const userLanguages = (Array.isArray(other.languages) ? other.languages : []).map(lang => {
      const langObj = languages.find(l => l.id === lang.id);
      return {
        name: langObj ? langObj.name : lang.id,
        proficiency: lang.proficiency
      };
    });
    
    // Handle interests
    const userInterests = (Array.isArray(other.interests) ? other.interests : []).map(interestId => {
      const interestObj = interests.find(i => i.id === interestId);
      return interestObj ? interestObj.name : interestId;
    });
    
    return {
      id: other.id,
      name: `${other.first_name} ${other.last_name}`,
      avatar: other.avatar_url,
      university,
      major,
      studentType: other.student_type || 'international',
      interests: userInterests,
      languages: userLanguages,
      bio: other.bio || '',
      matchPercentage: Math.round(other.match_score || 0),
      nationality: other.nationality
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      } 
    }
  };

  // Render skeletons when loading
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        
        <div className="mt-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-pink">{profile?.first_name || 'User'}</span>!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Here's what's happening with your connections.
        </p>
      </motion.div>
      
      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Connections</p>
                <p className="text-2xl font-bold">{recentMatches.length}</p>
              </div>
              <div className="bg-brand-purple/10 rounded-full p-3">
                <Users size={24} className="text-brand-purple" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/matches')}>
                <span className="text-sm">View all connections</span>
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{pendingMatches.length}</p>
              </div>
              <div className="bg-brand-pink/10 rounded-full p-3">
                <Heart size={24} className="text-brand-pink" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/matches')}>
                <span className="text-sm">Review requests</span>
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Meetups</p>
                <p className="text-2xl font-bold">{upcomingMeetups.length}</p>
              </div>
              <div className="bg-brand-blue/10 rounded-full p-3">
                <Coffee size={24} className="text-brand-blue" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/meetups')}>
                <span className="text-sm">View all meetups</span>
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Notifications</p>
                <p className="text-2xl font-bold">{unreadNotifications.length}</p>
              </div>
              <div className="bg-brand-yellow/10 rounded-full p-3">
                <Bell size={24} className="text-brand-yellow" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/notifications')}>
                <span className="text-sm">View all notifications</span>
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Connections Section */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-brand-purple/10 to-brand-blue/5 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={18} className="text-brand-purple" />
                    Your Connections
                  </CardTitle>
                  <CardDescription>
                    Recent connections and pending requests
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/matches')}
                  className="hover:bg-brand-purple/5"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="connected" className="w-full">
                <div className="px-6 pt-4">
                  <TabsList className="w-full bg-gray-100">
                    <TabsTrigger value="connected" className="flex-1">
                      Connected
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex-1">
                      Pending
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="connected" className="p-0 mt-0">
                  {recentMatches.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-500 mb-4">You don't have any connections yet.</p>
                      <Button 
                        variant="outline"
                        className="text-brand-purple border-brand-purple/30 hover:bg-brand-purple/5"
                        onClick={() => navigate('/feed')}
                      >
                        <Search size={16} className="mr-2" />
                        Find New Connections
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {recentMatches.map((match, i) => (
                        <motion.div 
                          key={match.id} 
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                          variants={itemVariants}
                          custom={i}
                        >
                          <Link to={`/chat/${match.id}`} className="flex items-center gap-4">
                            <Avatar profile={formatProfileData(match)} size="sm" />
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium truncate">{formatProfileData(match)?.name}</h4>
                                <Badge className={`${
                                  formatProfileData(match)?.matchPercentage >= 80 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                  {formatProfileData(match)?.matchPercentage}% match
                                </Badge>
                              </div>
                              <div className="flex text-sm text-gray-500">
                                <p className="truncate">{formatProfileData(match)?.university}</p>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                      
                      <div className="p-4 text-center">
                        <Button 
                          variant="link" 
                          className="text-brand-purple"
                          onClick={() => navigate('/matches')}
                        >
                          View All Connections <ArrowRight size={16} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="pending" className="p-0 mt-0">
                  {pendingMatches.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-500 mb-4">No pending connection requests.</p>
                      <Button 
                        variant="outline"
                        className="text-brand-purple border-brand-purple/30 hover:bg-brand-purple/5"
                        onClick={() => navigate('/feed')}
                      >
                        <Search size={16} className="mr-2" />
                        Find New Connections
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {pendingMatches.map((match, i) => (
                        <motion.div 
                          key={match.id} 
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                          variants={itemVariants}
                          custom={i}
                        >
                          <Link to={`/matches`} className="flex items-center gap-4">
                            <Avatar profile={formatProfileData(match)} size="sm" />
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium truncate">{formatProfileData(match)?.name}</h4>
                                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                              </div>
                              <div className="flex text-sm text-gray-500">
                                <p className="truncate">{formatProfileData(match)?.university}</p>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                      
                      <div className="p-4 text-center">
                        <Button 
                          variant="link" 
                          className="text-brand-purple"
                          onClick={() => navigate('/matches')}
                        >
                          View All Requests <ArrowRight size={16} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Messages Section */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-brand-blue/10 to-brand-purple/5 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare size={18} className="text-brand-blue" />
                      Recent Messages
                    </CardTitle>
                    <CardDescription>
                      Your latest conversations
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/chat')}
                    className="hover:bg-brand-blue/5"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {recentMessages.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500 mb-4">No messages yet.</p>
                    <Button 
                      variant="outline"
                      className="text-brand-blue border-brand-blue/30 hover:bg-brand-blue/5"
                      onClick={() => navigate('/matches')}
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Start a Conversation
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {/* We'd need to fetch sender profiles, but for now using placeholder */}
                    {recentMessages.map((conversation, i) => (
                      <motion.div 
                        key={conversation.id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                        variants={itemVariants}
                        custom={i}
                      >
                        <Link to={`/chat/${conversation.match_id}`} className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <MessageSquare size={18} className="text-gray-500" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium truncate">Conversation</h4>
                              <span className="text-xs text-gray-500">
                                {formatDate(conversation.last_message.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.last_message.content}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    
                    <div className="p-4 text-center">
                      <Button 
                        variant="link" 
                        className="text-brand-blue"
                        onClick={() => navigate('/chat')}
                      >
                        View All Messages <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Upcoming Meetups Section */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-brand-pink/10 to-brand-purple/5 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar size={18} className="text-brand-pink" />
                      Upcoming Meetups
                    </CardTitle>
                    <CardDescription>
                      Your scheduled coffee dates
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/meetups')}
                    className="hover:bg-brand-pink/5"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {upcomingMeetups.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500 mb-4">No upcoming meetups.</p>
                    <Button 
                      variant="outline"
                      className="text-brand-pink border-brand-pink/30 hover:bg-brand-pink/5"
                      onClick={() => navigate('/matches')}
                    >
                      <Coffee size={16} className="mr-2" />
                      Schedule a Meetup
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {upcomingMeetups.map((meetup, i) => (
                      <motion.div 
                        key={meetup.id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                        variants={itemVariants}
                        custom={i}
                      >
                        <Link to={`/meetups/${meetup.id}`} className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center">
                            <Coffee size={18} className="text-brand-pink" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium truncate">{meetup.location_name}</h4>
                              <Badge className="bg-green-100 text-green-800">
                                {meetup.status}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 gap-1">
                              <Calendar size={12} />
                              <p>{formatDate(meetup.date)}</p>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    
                    <div className="p-4 text-center">
                      <Button 
                        variant="link" 
                        className="text-brand-pink"
                        onClick={() => navigate('/meetups')}
                      >
                        View All Meetups <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      {/* Recommended Matches */}
      <motion.div variants={itemVariants} className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recommended For You</h2>
          <Button 
            variant="link" 
            className="text-brand-purple"
            onClick={() => navigate('/feed')}
          >
            Explore More <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentMatches.length === 0 ? (
            <Card className="p-6 text-center col-span-full">
              <p className="text-gray-500 mb-4">Discover more students to enhance your recommendations.</p>
              <Button 
                onClick={() => navigate('/feed')} 
                className="bg-gradient-to-r from-brand-purple to-brand-pink text-white"
              >
                <Search className="mr-2 h-4 w-4" />
                Browse Students
              </Button>
            </Card>
          ) : (
            <>
              {recentMatches.slice(0, 3).map((match, i) => (
                <motion.div
                  key={match.id}
                  variants={itemVariants}
                  custom={i}
                  whileHover={{ y: -5 }}
                >
                  <EnhancedProfileCard
                    profile={formatProfileData(match)}
                    onMessage={() => navigate(`/chat/${match.id}`)}
                    onMeetup={() => navigate(`/meetup/${match.id}`)}
                    compact={true}
                  />
                </motion.div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Simple Avatar component to display profile avatars
const Avatar = ({ profile, size = "md" }) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };
  
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
  
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-brand-purple to-brand-pink text-white flex items-center justify-center`}>
      {profile?.avatar ? (
        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium">{initials}</span>
      )}
    </div>
  );
};

export default Dashboard;

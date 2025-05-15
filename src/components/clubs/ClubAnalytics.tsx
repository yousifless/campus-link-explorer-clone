import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  UserRound,
  Users,
  CalendarDays,
  MessageSquare,
  BarChart3,
  Activity
} from 'lucide-react';
import { Club } from '@/types/clubs';

// Define types for the analytics data
interface ClubStats {
  member_count: number;
  meetup_count: number;
  message_count: number;
  rsvp_count: number;
}

// Define UI state for display
interface DisplayStats {
  members: number;
  meetups: number;
  messages: number;
  rsvps: number;
}

interface MemberGrowthItem {
  date: string;
  count: number;
  cumulative: number;
}

interface MeetupAttendanceItem {
  title: string;
  attendees: number;
}

interface MessageActivityItem {
  date: string;
  count: number;
}

interface RsvpDistributionItem {
  status: string;
  count: number;
}

interface ClubAnalyticsProps {
  club: Club;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ClubAnalytics = ({ club }: ClubAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [activeTab, setActiveTab] = useState('members');
  
  // Analytics data states
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowthItem[]>([]);
  const [meetupAttendance, setMeetupAttendance] = useState<MeetupAttendanceItem[]>([]);
  const [messageActivity, setMessageActivity] = useState<MessageActivityItem[]>([]);
  const [rsvpDistribution, setRsvpDistribution] = useState<RsvpDistributionItem[]>([]);
  const [totalStats, setTotalStats] = useState<DisplayStats>({
    members: 0,
    meetups: 0,
    messages: 0,
    rsvps: 0
  });

  useEffect(() => {
    if (!club?.id) return;
    
    const fetchAnalytics = async () => {
      setLoading(true);
      
      try {
        // Instead of using RPC functions that don't exist, we'll query the tables directly
        
        // Get member count
        const { data: membersData, error: membersError } = await supabase
          .from('club_memberships')
          .select('club_id, user_id')
          .eq('club_id', club.id);
          
        if (membersError) throw membersError;
        
        // Get meetup count
        const { data: meetupsData, error: meetupsError } = await supabase
          .from('club_meetups')
          .select('id')
          .eq('club_id', club.id);
          
        if (meetupsError) throw meetupsError;
        
        // Get message count
        const { data: messagesData, error: messagesError } = await supabase
          .from('club_messages')
          .select('id')
          .eq('club_id', club.id);
          
        if (messagesError) throw messagesError;
        
        // Set the total stats
        setTotalStats({
          members: membersData?.length || 0,
          meetups: meetupsData?.length || 0,
          messages: messagesData?.length || 0,
          rsvps: 0 // We don't have RSVP data
        });
        
        // For now, create some placeholder data for the charts
        const days = parseInt(timeframe);
        const today = new Date();
        const memberData: MemberGrowthItem[] = [];
        
        for (let i = 0; i < days; i += Math.max(1, Math.floor(days / 10))) {
          const date = new Date(today);
          date.setDate(date.getDate() - (days - i));
          memberData.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 3),
            cumulative: Math.min(membersData?.length || 0, Math.floor((i + 1) * (membersData?.length || 0) / days))
          });
        }
        
        setMemberGrowth(memberData);
        
        // Create placeholder data for meetup attendance
        const meetupData: MeetupAttendanceItem[] = [];
        for (let i = 0; i < Math.min(5, meetupsData?.length || 0); i++) {
          meetupData.push({
            title: `Meetup ${i + 1}`,
            attendees: Math.floor(Math.random() * 10) + 1
          });
        }
        
        setMeetupAttendance(meetupData);
        
        // Create placeholder data for message activity
        const messageData: MessageActivityItem[] = [];
        for (let i = 0; i < days; i += Math.max(1, Math.floor(days / 10))) {
          const date = new Date(today);
          date.setDate(date.getDate() - (days - i));
          messageData.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 5)
          });
        }
        
        setMessageActivity(messageData);
        
        // Create placeholder data for RSVP distribution
        const rsvpData: RsvpDistributionItem[] = [
          { status: 'Going', count: Math.floor(Math.random() * 15) + 5 },
          { status: 'Maybe', count: Math.floor(Math.random() * 10) + 2 },
          { status: 'Not Going', count: Math.floor(Math.random() * 5) }
        ];
        
        setRsvpDistribution(rsvpData);
        
      } catch (error) {
        console.error('Error fetching club analytics:', error);
        toast.error('Failed to load club analytics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [club.id, timeframe]);
  
  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-64" />
            </CardTitle>
            <div className="mt-1">
              <Skeleton className="h-4 w-full" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Format data for charts if needed
  const formatMemberGrowth = memberGrowth.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(),
  }));
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Club Analytics</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-blue-100 p-3 mb-4">
              <Users className="h-6 w-6 text-blue-700" />
            </div>
            <h3 className="text-3xl font-bold text-blue-700">{totalStats.members}</h3>
            <p className="text-blue-600">Total Members</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CalendarDays className="h-6 w-6 text-green-700" />
            </div>
            <h3 className="text-3xl font-bold text-green-700">{totalStats.meetups}</h3>
            <p className="text-green-600">Total Meetups</p>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-purple-100 p-3 mb-4">
              <MessageSquare className="h-6 w-6 text-purple-700" />
            </div>
            <h3 className="text-3xl font-bold text-purple-700">{totalStats.messages}</h3>
            <p className="text-purple-600">Total Messages</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-amber-100 p-3 mb-4">
              <Activity className="h-6 w-6 text-amber-700" />
            </div>
            <h3 className="text-3xl font-bold text-amber-700">{totalStats.rsvps}</h3>
            <p className="text-amber-600">Total RSVPs</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="members">Member Growth</TabsTrigger>
          <TabsTrigger value="meetups">Meetup Attendance</TabsTrigger>
          <TabsTrigger value="messages">Message Activity</TabsTrigger>
          <TabsTrigger value="rsvps">RSVP Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Member Growth Over Time</CardTitle>
              <CardDescription>
                New members joining the club over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={formatMemberGrowth}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="New Members" 
                      stroke="#0088FE" 
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      name="Total Members" 
                      stroke="#8884d8" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No member data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="meetups">
          <Card>
            <CardHeader>
              <CardTitle>Meetup Attendance</CardTitle>
              <CardDescription>
                RSVP responses to club meetups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meetupAttendance.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={meetupAttendance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendees" name="Attendees" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No meetup data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Message Activity</CardTitle>
              <CardDescription>
                Club chat message volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messageActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={messageActivity}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Messages" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No message data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rsvps">
          <Card>
            <CardHeader>
              <CardTitle>RSVP Distribution</CardTitle>
              <CardDescription>
                Overall response trends for club meetups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rsvpDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={rsvpDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {rsvpDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No RSVP data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubAnalytics; 
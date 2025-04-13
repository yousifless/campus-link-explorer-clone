
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, Coffee, MapPin, BellRing, ShieldCheck, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import MeetupCard from '@/components/meetups/MeetupCard';
import NewMeetupSheet from '@/components/meetups/NewMeetupSheet';
import { MeetupType } from '@/types/database';
import { format } from 'date-fns';

// Mock data for development
const MOCK_MEETUPS: MeetupType[] = [
  {
    id: '1',
    creator_id: 'current-user-id',
    invitee_id: 'user-2',
    status: 'confirmed',
    proposed_date: '2025-05-10',
    proposed_time: '15:00',
    location_name: 'Starbucks Shibuya',
    location_address: '1-23-45 Shibuya, Tokyo',
    notes: 'Looking forward to discussing our project!',
    created_at: '2025-04-05T10:30:00Z',
    invitee: {
      first_name: 'Yuki',
      last_name: 'Tanaka',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'
    }
  },
  {
    id: '2',
    creator_id: 'user-3',
    invitee_id: 'current-user-id',
    status: 'pending',
    proposed_date: '2025-05-12',
    proposed_time: '13:30',
    location_name: 'Tully\'s Coffee Ikebukuro',
    location_address: '2-1-2 Ikebukuro, Tokyo',
    notes: 'Let\'s chat about our Japanese language exchange!',
    created_at: '2025-04-07T09:15:00Z',
    creator: {
      first_name: 'Ken',
      last_name: 'Watanabe',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400'
    }
  }
];

const Meetups = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sheet, setSheet] = useState(false);
  const { toast } = useToast();
  
  const upcomingMeetups = MOCK_MEETUPS.filter(
    meetup => meetup.status === 'confirmed'
  );
  
  const pendingMeetups = MOCK_MEETUPS.filter(
    meetup => meetup.status === 'pending'
  );

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coffee Meetups</h1>
            <p className="text-muted-foreground">
              Schedule casual meetups with fellow students
            </p>
          </div>
          <Button 
            onClick={() => setSheet(true)} 
            className="w-full md:w-auto"
          >
            <Coffee className="mr-2 h-4 w-4" />
            Schedule New Meetup
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar and Safety Tips */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  <span>Calendar</span>
                </CardTitle>
                <CardDescription>Select a date to view meetups</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="border rounded-md"
                />

                {date && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-medium mb-2">
                      {format(date, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {upcomingMeetups.some(
                        m => m.proposed_date === format(date, 'yyyy-MM-dd')
                      ) ? (
                        <p>You have meetups scheduled on this date.</p>
                      ) : (
                        <p>No meetups scheduled for this date.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> 
                  <span>Safety Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Always meet in public places with plenty of people around.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Consider bringing a friend if it's your first time meeting someone.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BellRing className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Let someone know where you're going and when you expect to return.</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full text-sm">
                  Read More Safety Guidelines
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming and Pending Meetups */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  {pendingMeetups.length > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {pendingMeetups.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="mt-0">
                {upcomingMeetups.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                      <Coffee className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No upcoming meetups</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You don't have any confirmed meetups scheduled.
                      </p>
                      <Button onClick={() => setSheet(true)}>
                        Schedule a Meetup
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {upcomingMeetups.map((meetup) => (
                      <MeetupCard key={meetup.id} meetup={meetup} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pending" className="mt-0">
                {pendingMeetups.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                      <Coffee className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No pending meetups</h3>
                      <p className="text-sm text-muted-foreground">
                        You don't have any pending meetup requests.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingMeetups.map((meetup) => (
                      <MeetupCard key={meetup.id} meetup={meetup} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <NewMeetupSheet open={sheet} onOpenChange={setSheet} />
    </div>
  );
};

export default Meetups;

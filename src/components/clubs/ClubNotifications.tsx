import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ClubNotificationType } from '@/types/clubs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  Bell,
  Calendar,
  Users,
  MessageSquare,
  AlertCircle,
  Settings,
  ChevronRight,
  Check,
  BellOff,
  BellRing,
  HelpCircle,
  X
} from 'lucide-react';

interface ClubNotification {
  id: string;
  user_id: string;
  type: ClubNotificationType;
  content: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  new_club_invite: boolean;
  new_meetup: boolean;
  meetup_reminder: boolean;
  club_chat_mention: boolean;
  meetup_rsvp_update: boolean;
  club_announcement: boolean;
}

interface ClubNotificationsProps {
  clubId?: string; // Optional: to filter by specific club
}

const ClubNotifications: React.FC<ClubNotificationsProps> = ({ clubId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ClubNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_club_invite: true,
    new_meetup: true,
    meetup_reminder: true,
    club_chat_mention: true,
    meetup_rsvp_update: true,
    club_announcement: true,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');

  // Fetch notifications when component mounts
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // Fetch club-related notifications
        const query = supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .in('type', [
            'new_club_invite',
            'new_meetup',
            'meetup_reminder',
            'club_chat_mention',
            'meetup_rsvp_update',
            'club_announcement'
          ])
          .order('created_at', { ascending: false });
          
        // Optionally filter by club ID if provided
        if (clubId) {
          // This assumes that related_id can reference a club_id or a meetup_id
          // In a real implementation, you might need a more sophisticated query
          query.filter('related_id', 'in', (subquery) => {
            subquery
              .from('club_meetups')
              .select('id')
              .eq('club_id', clubId);
          });
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setNotifications(data || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    // Fetch user notification preferences
    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (!error && data) {
          setPreferences({
            new_club_invite: data.new_club_invite,
            new_meetup: data.new_meetup,
            meetup_reminder: data.meetup_reminder,
            club_chat_mention: data.club_chat_mention,
            meetup_rsvp_update: data.meetup_rsvp_update,
            club_announcement: data.club_announcement,
          });
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
      }
    };

    fetchNotifications();
    fetchPreferences();

    // Subscribe to new notifications
    const notificationsSubscription = supabase
      .channel('club_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        // Check if notification is club-related
        const notification = payload.new as ClubNotification;
        const clubNotificationTypes = [
          'new_club_invite',
          'new_meetup',
          'meetup_reminder',
          'club_chat_mention',
          'meetup_rsvp_update',
          'club_announcement'
        ];
        
        if (clubNotificationTypes.includes(notification.type)) {
          setNotifications(prev => [notification, ...prev]);
          
          // Show toast for new notification
          toast(notification.content, {
            description: new Date(notification.created_at).toLocaleTimeString(),
            action: {
              label: "View",
              onClick: () => {
                if (notification.related_id) {
                  if (notification.type === 'new_meetup' || notification.type === 'meetup_reminder') {
                    // Find the club ID for this meetup
                    supabase
                      .from('club_meetups')
                      .select('club_id')
                      .eq('id', notification.related_id)
                      .single()
                      .then(({ data }) => {
                        if (data?.club_id) {
                          navigate(`/clubs/${data.club_id}/meetups/${notification.related_id}`);
                        }
                      });
                  } else if (notification.type === 'new_club_invite') {
                    navigate(`/clubs/${notification.related_id}`);
                  }
                }
              },
            },
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [user, clubId, navigate]);

  // Mark notification as read
  const markAsRead = async (notification: ClubNotification) => {
    if (!user) return;
    
    try {
      // Update local state first for responsive UI
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      
      // Then update in database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
        
      if (error) throw error;
      
      // Navigate if there's a related item
      if (notification.related_id) {
        if (notification.type === 'new_meetup' || notification.type === 'meetup_reminder' || notification.type === 'meetup_rsvp_update') {
          // Find the club ID for this meetup
          const { data, error } = await supabase
            .from('club_meetups')
            .select('club_id')
            .eq('id', notification.related_id)
            .single();
            
          if (!error && data?.club_id) {
            navigate(`/clubs/${data.club_id}/meetups/${notification.related_id}`);
          }
        } else if (notification.type === 'new_club_invite' || notification.type === 'club_announcement') {
          navigate(`/clubs/${notification.related_id}`);
        } else if (notification.type === 'club_chat_mention') {
          // Find the club ID for this chat message
          const { data, error } = await supabase
            .from('club_messages')
            .select('club_id')
            .eq('id', notification.related_id)
            .single();
            
          if (!error && data?.club_id) {
            // Navigate to club chat tab
            navigate(`/clubs/${data.club_id}?tab=chat`);
          }
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to update notification');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Update local state first
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      
      // Then update in database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('type', [
          'new_club_invite',
          'new_meetup',
          'meetup_reminder',
          'club_chat_mention',
          'meetup_rsvp_update',
          'club_announcement'
        ]);
        
      if (error) throw error;
      
      toast.success('Marked all notifications as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to update notifications');
    }
  };

  // Update notification preferences
  const updatePreferences = async (type: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;
    
    try {
      // Update local state for immediate UI update
      setPreferences(prev => ({ ...prev, [type]: value }));
      
      // Update in database using upsert
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          [type]: value,
        });
        
      if (error) throw error;
    } catch (err) {
      console.error('Error updating preferences:', err);
      toast.error('Failed to update notification preferences');
      
      // Revert local state on error
      setPreferences(prev => ({ ...prev, [type]: !value }));
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: ClubNotificationType) => {
    switch (type) {
      case 'new_club_invite':
        return <Users className="h-4 w-4" />;
      case 'new_meetup':
      case 'meetup_reminder':
        return <Calendar className="h-4 w-4" />;
      case 'club_chat_mention':
        return <MessageSquare className="h-4 w-4" />;
      case 'meetup_rsvp_update':
        return <Check className="h-4 w-4" />;
      case 'club_announcement':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get formatted date
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours ago, show relative time
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours < 1) {
        const minutes = Math.floor(diff / (60 * 1000));
        return minutes <= 0 ? 'Just now' : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    }
    
    // If less than 7 days ago, show day of week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Otherwise, show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Club Notifications
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Stay updated with your club activities
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 h-3 w-3 rounded-full bg-red-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="notifications" className="pt-2">
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <BellOff className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When you receive notifications about club activities, they'll appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        notification.is_read 
                          ? 'hover:bg-gray-50' 
                          : 'bg-blue-50/50 hover:bg-blue-50'
                      } cursor-pointer`}
                      onClick={() => markAsRead(notification)}
                    >
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                        notification.is_read 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {getNotificationIcon(notification.type as ClubNotificationType)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getFormattedDate(notification.created_at)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          
          <CardFooter className="justify-end">
            {notifications.length > 0 && (
              <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
                Mark all as read
              </Button>
            )}
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="settings" className="pt-2">
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="new_club_invite">Club Invitations</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When you're invited to join a club
                    </p>
                  </div>
                  <Switch
                    id="new_club_invite"
                    checked={preferences.new_club_invite}
                    onCheckedChange={(value) => updatePreferences('new_club_invite', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="new_meetup">New Meetups</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When a new meetup is scheduled for your club
                    </p>
                  </div>
                  <Switch
                    id="new_meetup"
                    checked={preferences.new_meetup}
                    onCheckedChange={(value) => updatePreferences('new_meetup', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="meetup_reminder">Meetup Reminders</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reminders about upcoming meetups
                    </p>
                  </div>
                  <Switch
                    id="meetup_reminder"
                    checked={preferences.meetup_reminder}
                    onCheckedChange={(value) => updatePreferences('meetup_reminder', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="club_chat_mention">Chat Mentions</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When you're mentioned in club chats
                    </p>
                  </div>
                  <Switch
                    id="club_chat_mention"
                    checked={preferences.club_chat_mention}
                    onCheckedChange={(value) => updatePreferences('club_chat_mention', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="meetup_rsvp_update">RSVP Updates</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When people respond to your meetups
                    </p>
                  </div>
                  <Switch
                    id="meetup_rsvp_update"
                    checked={preferences.meetup_rsvp_update}
                    onCheckedChange={(value) => updatePreferences('meetup_rsvp_update', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="club_announcement">Club Announcements</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Important announcements from your clubs
                    </p>
                  </div>
                  <Switch
                    id="club_announcement"
                    checked={preferences.club_announcement}
                    onCheckedChange={(value) => updatePreferences('club_announcement', value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ClubNotifications; 
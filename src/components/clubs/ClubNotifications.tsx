
import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Define proper types for notifications
export type ClubNotificationType = 
  | 'new_club_invite' 
  | 'new_meetup' 
  | 'meetup_reminder' 
  | 'club_chat_mention'
  | 'meetup_rsvp_update'
  | 'club_announcement'
  | 'other';

interface ClubNotification {
  id: string;
  user_id: string;
  type: ClubNotificationType;
  content: string;
  related_id: string;
  is_read: boolean;
  created_at: string;
}

// Define the extended notification preferences type
interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  club_notifications: boolean;
  message_notifications: boolean;
  match_notifications: boolean;
  event_reminders: boolean;
  created_at: string;
  updated_at: string;
  // The following properties might not exist in the database schema yet
  // We'll handle them safely in the code
  new_club_invite?: boolean;
  new_meetup?: boolean;
  meetup_reminder?: boolean;
  club_chat_mention?: boolean;
  meetup_rsvp_update?: boolean;
  club_announcement?: boolean;
}

const ClubNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClubNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Safely convert string types to our enum type
      if (data) {
        const typedNotifications = data.map(notification => ({
          ...notification,
          // Cast the string type to our ClubNotificationType
          type: validateNotificationType(notification.type)
        }));
        
        setNotifications(typedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to validate notification type
  const validateNotificationType = (type: string): ClubNotificationType => {
    const validTypes: ClubNotificationType[] = [
      'new_club_invite',
      'new_meetup',
      'meetup_reminder',
      'club_chat_mention',
      'meetup_rsvp_update',
      'club_announcement'
    ];
    
    return validTypes.includes(type as ClubNotificationType) 
      ? type as ClubNotificationType 
      : 'other';
  };

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences if none exist
        const defaultPreferences = {
          user_id: user?.id,
          email_notifications: true,
          push_notifications: true,
          club_notifications: true,
          message_notifications: true,
          match_notifications: true,
          event_reminders: true,
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const updatePreference = async (field: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    
    try {
      // Temporarily update UI
      setPreferences({ ...preferences, [field]: value });
      
      // Only update fields that exist in the database schema
      const validDbFields = [
        'email_notifications',
        'push_notifications',
        'club_notifications',
        'message_notifications',
        'match_notifications',
        'event_reminders'
      ];
      
      if (validDbFields.includes(field)) {
        const { error } = await supabase
          .from('user_notification_preferences')
          .update({ [field]: value })
          .eq('id', preferences.id);

        if (error) throw error;
      } else {
        console.warn(`Field ${field} doesn't exist in the database schema yet`);
        // Here you could implement logic to handle custom fields if needed
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert UI on error
      fetchPreferences();
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: ClubNotificationType) => {
    switch (type) {
      case 'new_club_invite':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'new_meetup':
      case 'meetup_reminder':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'meetup_rsvp_update':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderNotificationsList = () => {
    if (notifications.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p>No notifications yet</p>
        </div>
      );
    }

    return notifications.map(notification => (
      <div 
        key={notification.id} 
        className={`flex items-start p-3 border-b last:border-0 hover:bg-gray-50 transition-colors ${
          !notification.is_read ? 'bg-blue-50' : ''
        }`}
      >
        <div className="mr-3 mt-1">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1">
          <p className="text-sm">{notification.content}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {new Date(notification.created_at).toLocaleString()}
            </span>
            {!notification.is_read && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => markAsRead(notification.id)}
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notifications</span>
            <Badge variant="outline" className="ml-2">
              {notifications.filter(n => !n.is_read).length} new
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            renderNotificationsList()
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Email Notifications</h3>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={preferences.email_notifications} 
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Push Notifications</h3>
                  <p className="text-xs text-gray-500">Receive push notifications</p>
                </div>
                <Switch 
                  checked={preferences.push_notifications} 
                  onCheckedChange={(checked) => updatePreference('push_notifications', checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Club Notifications</h3>
                  <p className="text-xs text-gray-500">Updates about clubs you've joined</p>
                </div>
                <Switch 
                  checked={preferences.club_notifications} 
                  onCheckedChange={(checked) => updatePreference('club_notifications', checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Message Notifications</h3>
                  <p className="text-xs text-gray-500">Notifications for new messages</p>
                </div>
                <Switch 
                  checked={preferences.message_notifications} 
                  onCheckedChange={(checked) => updatePreference('message_notifications', checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Meetup Reminders</h3>
                  <p className="text-xs text-gray-500">Reminders about upcoming meetups</p>
                </div>
                <Switch 
                  checked={preferences.event_reminders} 
                  onCheckedChange={(checked) => updatePreference('event_reminders', checked)} 
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubNotifications;

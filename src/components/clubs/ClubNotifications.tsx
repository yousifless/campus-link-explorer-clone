
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Mail, MessageCircle, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ClubNotification, ClubNotificationType, ClubNotificationPreferences } from '@/types/clubTypes';

interface ClubNotificationsProps {
  clubId?: string; // Optional clubId for club-specific notifications
}

const ClubNotifications: React.FC<ClubNotificationsProps> = ({ clubId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClubNotification[]>([]);
  const [preferences, setPreferences] = useState<Partial<ClubNotificationPreferences>>({
    club_notifications: true,
    new_club_invite: true,
    new_meetup: true,
    meetup_reminder: true,
    club_chat_mention: true,
    club_announcement: true,
    email_notifications: true,
    push_notifications: true,
    message_notifications: true,
    event_reminders: true,
    match_notifications: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [user, clubId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Add club filter if clubId is provided
      if (clubId) {
        query = query.eq('related_id', clubId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        // Convert string types to ClubNotificationType enum
        const typedNotifications = data.map(notification => ({
          ...notification,
          type: notification.type as ClubNotificationType
        }));
        setNotifications(typedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      // First check if user has preferences record
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user?.id || '')
        .single();
      
      if (error && error.code !== 'PGSQL_NO_ROWS_RETURNED') {
        throw error;
      }
      
      // If preferences exist, set them in state
      if (data) {
        // Create default values for properties that might not exist in the DB
        setPreferences({
          ...preferences,
          ...data,
          // Ensure club-specific notifications have default values if not in DB
          new_club_invite: data.club_notifications ?? true,
          new_meetup: data.event_reminders ?? true,
          meetup_reminder: data.event_reminders ?? true,
          club_chat_mention: data.message_notifications ?? true,
          club_announcement: data.club_notifications ?? true,
        });
      } else {
        // Create default preferences if none exist
        await createDefaultPreferences();
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    }
  };

  const createDefaultPreferences = async () => {
    try {
      const defaultPrefs = {
        user_id: user?.id,
        club_notifications: true,
        email_notifications: true,
        push_notifications: true,
        message_notifications: true,
        event_reminders: true,
        match_notifications: true
      };
      
      await supabase.from('user_notification_preferences').insert(defaultPrefs);
      setPreferences({
        ...preferences,
        ...defaultPrefs,
      });
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updatePreference = async (key: keyof ClubNotificationPreferences, value: boolean) => {
    try {
      // Update local state immediately
      setPreferences({
        ...preferences,
        [key]: value,
      });
      
      // Map special club notification types to their general categories
      let updateObj: Record<string, boolean> = {
        [key]: value,
      };
      
      // If updating a club-specific preference, update the general category too
      if (key === 'new_club_invite' || key === 'club_announcement') {
        updateObj.club_notifications = value;
      } else if (key === 'new_meetup' || key === 'meetup_reminder') {
        updateObj.event_reminders = value;
      } else if (key === 'club_chat_mention') {
        updateObj.message_notifications = value;
      }
      
      // Update in database
      const { error } = await supabase
        .from('user_notification_preferences')
        .update(updateObj)
        .eq('user_id', user?.id || '');
      
      if (error) throw error;
      
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preferences',
        variant: 'destructive',
      });
      
      // Revert local state on error
      fetchPreferences();
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id || '')
        .in('is_read', [false]);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      
      toast({
        title: 'Marked as read',
        description: 'All notifications have been marked as read',
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notifications',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: ClubNotificationType) => {
    switch (type) {
      case 'new_club_invite':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'new_meetup':
      case 'meetup_reminder':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'club_chat_mention':
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      case 'club_announcement':
        return <Mail className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={!notifications.some(n => !n.is_read)}
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-blue-500" />
                <Label htmlFor="club-notifications">Club Invites</Label>
              </div>
              <Switch
                id="club-notifications"
                checked={preferences?.new_club_invite ?? true}
                onCheckedChange={(value) => updatePreference('new_club_invite', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <Label htmlFor="meetup-notifications">New Meetups</Label>
              </div>
              <Switch
                id="meetup-notifications"
                checked={preferences?.new_meetup ?? true}
                onCheckedChange={(value) => updatePreference('new_meetup', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                <Label htmlFor="reminder-notifications">Meetup Reminders</Label>
              </div>
              <Switch
                id="reminder-notifications"
                checked={preferences?.meetup_reminder ?? true}
                onCheckedChange={(value) => updatePreference('meetup_reminder', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-purple-500" />
                <Label htmlFor="chat-notifications">Chat Mentions</Label>
              </div>
              <Switch
                id="chat-notifications"
                checked={preferences?.club_chat_mention ?? true}
                onCheckedChange={(value) => updatePreference('club_chat_mention', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-orange-500" />
                <Label htmlFor="announcement-notifications">Club Announcements</Label>
              </div>
              <Switch
                id="announcement-notifications"
                checked={preferences?.club_announcement ?? true}
                onCheckedChange={(value) => updatePreference('club_announcement', value)}
              />
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences?.email_notifications ?? true}
                  onCheckedChange={(value) => updatePreference('email_notifications', value)}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <Label htmlFor="push-notifications">Push Notifications</Label>
              </div>
              <Switch
                id="push-notifications"
                checked={preferences?.push_notifications ?? true}
                onCheckedChange={(value) => updatePreference('push_notifications', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Notifications</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BellOff className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-muted-foreground">No notifications to display</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={notification.is_read ? 'bg-white' : 'bg-blue-50'}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className={`${notification.is_read ? 'font-normal' : 'font-medium'}`}>
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubNotifications;

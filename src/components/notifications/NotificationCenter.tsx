import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  X, 
  MessageCircle, 
  UserPlus, 
  Globe, 
  Clock, 
  Sun, 
  Moon, 
  Filter,
  User,
  GraduationCap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/types/database';

type FilterType = 'all' | 'match' | 'message';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      if (!user) return;
      setIsLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['match', 'message'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map database notifications to the proper Notification type
      const mappedNotifications: Notification[] = (data || []).map(item => ({
        id: item.id,
        type: item.type as 'match' | 'message',
        title: item.type === 'match' ? 'New Match!' : 'New Message',
        message: item.content,
        content: item.content,
        sender_id: item.related_id,
        created_at: item.created_at,
        read: item.is_read,
        is_read: item.is_read,
        user_id: item.user_id
      }));
      
      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription for matches and messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as any;
          if (newItem.type === 'message' || newItem.type === 'match') {
            const newNotification: Notification = {
              id: newItem.id,
              type: newItem.type as 'match' | 'message', 
              title: newItem.type === 'match' ? 'New Match!' : 'New Message',
              message: newItem.content,
              content: newItem.content,
              sender_id: newItem.related_id,
              created_at: newItem.created_at,
              read: newItem.is_read,
              is_read: newItem.is_read,
              user_id: newItem.user_id
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});

            // Show toast with animation
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 3000,
              className: "animate-in slide-in-from-right",
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => 
    activeFilter === 'all' || notification.type === activeFilter
  );

  // Handle notification expansion
  const toggleExpanded = (notificationId: string) => {
    setExpandedNotification(prev => prev === notificationId ? null : notificationId);
  };

  // Handle emoji reaction
  const handleReaction = async (notificationId: string, emoji: string) => {
    try {
      // Since notification_reactions table doesn't exist yet, let's log it
      console.log('Would save reaction:', { 
        notification_id: notificationId, 
        emoji, 
        user_id: user?.id
      });
      
      toast({
        title: "Reaction Sent",
        description: `You reacted with ${emoji}`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification action
  const handleAction = async (notification: Notification, action: 'accept' | 'decline' | 'message' | 'view') => {
    try {
      switch (action) {
        case 'accept':
          await supabase
            .from('matches')
            .update({ status: 'accepted' })
            .eq('id', notification.data?.match_id);
          break;
        case 'decline':
          await supabase
            .from('matches')
            .update({ status: 'declined' })
            .eq('id', notification.data?.match_id);
          break;
        case 'message':
          if (notification.type === 'message') {
            navigate(`/chat/${notification.data?.sender_id}`);
          } else {
            navigate(`/chat/${notification.sender_id}`);
          }
          break;
        case 'view':
          if (notification.type === 'match') {
            navigate('/matches');
          } else if (notification.type === 'message') {
            navigate(`/chat/${notification.data?.sender_id}`);
          }
          break;
      }

      markAsRead(notification.id);
    } catch (error) {
      console.error('Error handling notification action:', error);
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive",
      });
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'match':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge
                    variant="destructive"
                    className="h-5 w-5 rounded-full p-0 flex items-center justify-center"
                  >
                    {unreadCount}
                  </Badge>
                </motion.div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50",
              isDarkMode && "bg-gray-900 text-white"
            )}
          >
            <Card className={cn(isDarkMode && "bg-gray-900 border-gray-800")}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  {(['all', 'match', 'message'] as FilterType[]).map((filter) => (
                    <Toggle
                      key={filter}
                      pressed={activeFilter === filter}
                      onPressedChange={() => setActiveFilter(filter)}
                      className="capitalize"
                    >
                      {filter}
                    </Toggle>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "p-4 transition-all duration-200",
                            !notification.read && "bg-blue-50",
                            isDarkMode && !notification.read && "bg-blue-900/20",
                            "hover:bg-gray-50",
                            isDarkMode && "hover:bg-gray-800"
                          )}
                          onClick={() => handleAction(notification, 'view')}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {notification.sender_avatar ? (
                                <Avatar>
                                  <AvatarImage src={notification.sender_avatar} />
                                  <AvatarFallback>
                                    {notification.sender_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                getNotificationIcon(notification.type)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">
                                  {notification.title}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              {notification.match_percentage && (
                                <div className="mt-2">
                                  <Progress value={notification.match_percentage} className="h-2" />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notification.match_percentage}% match
                                  </p>
                                </div>
                              )}
                              {notification.type === 'match' && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(notification, 'accept');
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(notification, 'decline');
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(notification, 'message');
                                    }}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Message
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

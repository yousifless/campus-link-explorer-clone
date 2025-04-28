import React, { useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Bell, MessageSquare, Users, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'match_request':
    case 'match_accepted':
    case 'match_rejected':
      return <Users size={20} className="text-blue-500" />;
    case 'new_message':
      return <MessageSquare size={20} className="text-green-500" />;
    default:
      return <Bell size={20} className="text-orange-500" />;
  }
};

const getNotificationAction = (
  type: string, 
  relatedId: string | null,
  navigate: ReturnType<typeof useNavigate>
) => {
  if (!relatedId) return null;
  
  switch (type) {
    case 'match_request':
    case 'match_accepted':
    case 'match_rejected':
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            navigate('/matches');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refresh-matches'));
            }, 100);
          }}
        >
          View Matches
        </Button>
      );
    case 'new_message':
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/chat/${relatedId}`)}
        >
          Reply
        </Button>
      );
    default:
      return null;
  }
};

const Notifications = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, loading, unreadCount } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (loading && notifications.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Notifications</h2>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} new</Badge>
          )}
        </div>
        {notifications.some(n => !n.is_read) && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllAsRead()}
          >
            <CheckCheck size={16} className="mr-2" />
            Mark all as read
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            When you receive notifications, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`border-l-4 transition-colors ${
                notification.is_read ? 'border-l-transparent' : 'border-l-primary'
              }`}
              onClick={() => {
                if (!notification.is_read) {
                  markAsRead(notification.id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className={`${notification.is_read ? 'font-normal' : 'font-medium'}`}>
                      {notification.content}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    {getNotificationAction(notification.type, notification.related_id, navigate)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;


import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Notification } from './matching/types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      // Transform to match the Notification type
      const transformedNotifications: Notification[] = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        type: item.type,
        title: item.type, // Using type as title if not present
        message: item.content, // Using content as message
        content: item.content,
        is_read: item.is_read,
        read: item.is_read, // Adding read property for backward compatibility
        related_id: item.related_id || '',
        created_at: item.created_at
      }));
      setNotifications(transformedNotifications);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifications, fetchNotifications, loading }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

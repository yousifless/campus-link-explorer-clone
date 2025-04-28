import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: 'match' | 'message' | 'meetup';
  title: string;
  message: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  created_at: string;
  read: boolean;
  data?: any;
}

export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: any
): Promise<Notification> => {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false
    }])
    .select()
    .single();

  if (error) throw error;
  return notification;
};

export const notifyNewMessage = async (
  userId: string,
  senderId: string,
  senderName: string,
  message: string,
  senderAvatar?: string
) => {
  return createNotification(
    userId,
    'message',
    'New Message',
    message,
    {
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar
    }
  );
};

export const notifyNewMatch = async (
  userId: string,
  matchId: string,
  matchName: string,
  matchAvatar?: string
) => {
  return createNotification(
    userId,
    'match',
    'New Match',
    `You matched with ${matchName}!`,
    {
      match_id: matchId,
      match_name: matchName,
      match_avatar: matchAvatar
    }
  );
};

export const notifyMeetupProposal = async (
  userId: string,
  senderId: string,
  senderName: string,
  date: string,
  location: string,
  senderAvatar?: string
) => {
  return createNotification(
    userId,
    'meetup',
    'Coffee Meetup Proposal',
    `${senderName} wants to meet for coffee at ${location} on ${new Date(date).toLocaleDateString()}`,
    {
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      date,
      location
    }
  );
};

export const notifyMeetupUpdate = async (
  userId: string,
  senderId: string,
  senderName: string,
  status: 'accepted' | 'declined' | 'rescheduled',
  date?: string,
  location?: string,
  senderAvatar?: string
) => {
  const statusMessages = {
    accepted: 'accepted your coffee meetup proposal',
    declined: 'declined your coffee meetup proposal',
    rescheduled: 'wants to reschedule your coffee meetup'
  };

  return createNotification(
    userId,
    'meetup',
    'Meetup Update',
    `${senderName} ${statusMessages[status]}`,
    {
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      status,
      date,
      location
    }
  );
};

export const notifyProfileUpdate = async (userId: string) => {
  return createNotification(
    userId,
    'message',
    'Profile Updated',
    'Your profile has been updated successfully'
  );
};

export const notifyInterestUpdate = async (userId: string) => {
  return createNotification(
    userId,
    'message',
    'Interests Updated',
    'Your interests have been updated successfully'
  );
};

export const notifyAcademicUpdate = async (userId: string) => {
  return createNotification(
    userId,
    'message',
    'Academic Info Updated',
    'Your academic information has been updated successfully'
  );
}; 

// Define types for club-related components

export type ClubNotificationType = 
  'new_club_invite' | 
  'new_meetup' | 
  'meetup_reminder' | 
  'club_chat_mention' | 
  'club_announcement' | 
  'club_resource_added' |
  'membership_approved';

export interface ClubNotification {
  id: string;
  user_id: string;
  type: ClubNotificationType;
  content: string;
  related_id: string;
  is_read: boolean;
  created_at: string;
}

export interface ClubNotificationPreferences {
  id: string;
  user_id: string;
  club_notifications: boolean;
  new_club_invite: boolean;
  new_meetup: boolean;
  meetup_reminder: boolean;
  club_chat_mention: boolean;
  club_announcement: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  event_reminders: boolean;
  match_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubImage {
  id?: string;
  club_id: string;
  title: string;
  url: string;
  type: string;
  description?: string;
  created_by: string;
  created_at?: string;
}

export interface ClubResource {
  id?: string;
  club_id: string;
  title: string;
  url: string;
  type: string;
  description?: string;
  created_by: string;
  created_at?: string;
}

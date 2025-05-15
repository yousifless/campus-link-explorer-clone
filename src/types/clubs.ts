import { Database } from "@/integrations/supabase/types";

export enum ClubVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export type MemberRole = 'admin' | 'member';
export type MeetupRSVPStatus = 'pending' | 'yes' | 'no' | 'maybe';

export interface Club {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  course_code: string | null;
  visibility: ClubVisibility;
  join_code: string | null;
  created_by: string;
  created_at: string;
  creator_first_name?: string;
  creator_last_name?: string;
  creator_avatar_url?: string;
  member_count?: number;
  upcoming_meetups_count?: number;
  banner_url?: string | null;
  logo_url?: string | null;
  banner_signed_url?: string | null;
  logo_signed_url?: string | null;
}

export interface ClubMembership {
  club_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface ClubMeetup {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  max_attendees?: number | null;
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_by: string;
  created_at: string;
  creator?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  rsvp_count?: {
    yes: number;
    no: number;
    maybe: number;
    pending: number;
  };
  user_rsvp?: MeetupRSVPStatus;
  calendar_event_id?: string | null;
  color?: string | null;
  images?: string[] | null;
}

export interface ClubMeetupRSVP {
  meetup_id: string;
  user_id: string;
  status: MeetupRSVPStatus;
  responded_at: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  media_type?: string;
  media_url?: string;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  club?: {
    id: string;
    name: string;
    color?: string;
  };
  meetup: ClubMeetup;
}

export interface ClubImage {
  id: string;
  club_id: string;
  url: string;
  type: 'banner' | 'logo' | 'gallery';
  created_at: string;
}

export enum ClubNotificationType {
  NEW_CLUB_INVITE = 'new_club_invite',
  NEW_MEETUP = 'new_meetup',
  MEETUP_REMINDER = 'meetup_reminder',
  CLUB_CHAT_MENTION = 'club_chat_mention',
  MEETUP_RSVP_UPDATE = 'meetup_rsvp_update',
  CLUB_ANNOUNCEMENT = 'club_announcement'
} 
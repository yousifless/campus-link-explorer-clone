export interface ClubMeetup {
  id: string;
  club_id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  end_time?: string;
  duration_minutes?: number;
  max_attendees: number;
  location_name: string;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  color?: string;
  calendar_export?: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface MeetupAttendee {
  id: string;
  meetup_id: string;
  user_id: string;
  status: 'yes' | 'no' | 'maybe' | 'pending';
  created_at: string;
  updated_at?: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface MeetupAttendanceStatus {
  yes: number;
  no: number;
  maybe: number;
  pending: number;
  total: number;
  user_status?: 'yes' | 'no' | 'maybe' | 'pending' | null;
} 

export type MeetupStatus = 'pending' | 'confirmed' | 'declined' | 'rescheduled' | 'cancelled';

export interface CoffeeMeetup {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  date: string;
  location: string;
  message?: string;
  status: MeetupStatus;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  receiver?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

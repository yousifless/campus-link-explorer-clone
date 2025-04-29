
import { ProfileType } from './database';

export type MeetupStatus = 'pending' | 'confirmed' | 'declined' | 'rescheduled' | 'cancelled' | 'sipped';

export interface CoffeeMeetup {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  date: string;
  location_name: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  conversation_starter?: string;
  additional_notes?: string;
  status: MeetupStatus;
  created_at: string;
  updated_at: string;
  sender: ProfileType;
  receiver: ProfileType;
}

export interface CoffeeMeetupWithProfiles extends CoffeeMeetup {
  sender: ProfileType;
  receiver: ProfileType;
}

export interface MeetupProposal {
  match_id: string;
  receiver_id: string;
  date: string;
  location_name: string;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  conversation_starter?: string;
  additional_notes?: string;
}

export interface MeetupUpdate {
  status: MeetupStatus;
  date?: string;
  location_name?: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  conversation_starter?: string;
  additional_notes?: string;
}

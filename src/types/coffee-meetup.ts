
export type MeetupStatus = 'pending' | 'confirmed' | 'declined' | 'completed' | 'canceled';

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
  status: MeetupStatus;
  conversation_starter?: string | null;
  additional_notes?: string | null;
  created_at: string;
  updated_at?: string;
  creator?: any;
  invitee?: any;
}

export interface Location {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  }
}

export interface MapLocationPickerProps {
  onSelectLocation: (location: Location) => void;
  defaultLocation?: {
    lat: number;
    lng: number;
  };
}

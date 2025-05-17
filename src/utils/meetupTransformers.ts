import { CoffeeMeetup, CoffeeMeetupLocation } from '../contexts/matching/types';

/**
 * Transforms raw database meetup data into the CoffeeMeetup type
 */
export const transformMeetupData = (rawMeetup: any): CoffeeMeetup => {
  return {
    id: rawMeetup.id,
    match_id: rawMeetup.match_id,
    sender_id: rawMeetup.sender_id,
    receiver_id: rawMeetup.receiver_id,
    date: rawMeetup.date,
    status: rawMeetup.status as 'pending' | 'confirmed' | 'declined' | 'cancelled',
    created_at: rawMeetup.created_at,
    updated_at: rawMeetup.updated_at,
    conversation_starter: rawMeetup.conversation_starter,
    additional_notes: rawMeetup.additional_notes,
    // Add the location object
    location: {
      name: rawMeetup.location_name,
      address: rawMeetup.location_address,
      lat: rawMeetup.location_lat,
      lng: rawMeetup.location_lng
    },
    // Keep original properties for backward compatibility
    location_name: rawMeetup.location_name,
    location_address: rawMeetup.location_address,
    location_lat: rawMeetup.location_lat,
    location_lng: rawMeetup.location_lng
  };
};

/**
 * Transforms a CoffeeMeetup back to a format suitable for database insertion
 */
export const prepareMeetupForDb = (meetup: CoffeeMeetup): any => {
  const { location, ...restMeetup } = meetup;
  
  // Extract location properties if location object exists
  const locationProps = location ? {
    location_name: location.name,
    location_address: location.address,
    location_lat: location.lat,
    location_lng: location.lng
  } : {};
  
  return {
    ...restMeetup,
    ...locationProps
  };
};

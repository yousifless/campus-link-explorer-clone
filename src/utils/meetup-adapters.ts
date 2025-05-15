
import { CoffeeMeetup, CoffeeMeetupLocation } from '@/contexts/matching/types';

export function adaptToMeetupType(rawMeetupData: any): CoffeeMeetup {
  // Create the location object from the raw fields
  const location: CoffeeMeetupLocation = {
    name: rawMeetupData.location_name,
    address: rawMeetupData.location_address,
    lat: rawMeetupData.location_lat,
    lng: rawMeetupData.location_lng
  };

  // Return a properly formatted CoffeeMeetup object
  return {
    ...rawMeetupData,
    location
  };
}

export function adaptArrayToMeetupType(rawMeetupDataArray: any[]): CoffeeMeetup[] {
  return rawMeetupDataArray.map(adaptToMeetupType);
}

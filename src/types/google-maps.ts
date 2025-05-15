
// Type definitions for Google Maps API
export interface PlaceResult {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

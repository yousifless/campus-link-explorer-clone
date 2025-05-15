import { useGoogleMaps } from '@/providers/GoogleMapsProvider';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  photos?: string[];
  types?: string[];
  isOpen?: boolean;
  priceLevel?: number;
}

// Function to search for places near a location using the newer Places API
export const searchNearbyPlaces = async (
  center: { lat: number; lng: number },
  type: string = 'cafe',
  radius: number = 1000,
  keyword: string = ''
): Promise<PlaceResult[]> => {
  if (!window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  // Use the newer Places API 
  try {
    // Use the correct API to avoid deprecation warnings - need to use any for now due to typing issues
    const { places } = await window.google.maps.importLibrary('places') as any;
    
    // Use searchNearby method with the newer API structure
    const request = {
      locationRestriction: {
        circle: {
          center: { lat: center.lat, lng: center.lng },
          radius: radius
        }
      },
      includedType: type,
      keyword
    };

    // The places API structure is still evolving, so we need to use any for now
    const response = await places.searchNearby(request);
    const results = response?.places || [];
    
    // Format results to match our PlaceResult interface
    const formattedResults: PlaceResult[] = await Promise.all(
      results.map(async (place: any) => {
        // Get place details including formatted address
        const locationInfo = await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'rating', 
                  'types', 'priceLevel', 'photos', 'isOpen']
        });

        return {
          id: place.id || '',
          name: locationInfo.displayName || '',
          address: locationInfo.formattedAddress || '',
          lat: locationInfo.location?.lat || 0,
          lng: locationInfo.location?.lng || 0,
          rating: locationInfo.rating,
          photos: locationInfo.photos?.map((photo: any) => photo.getUrl({ maxWidth: 400, maxHeight: 300 })),
          types: locationInfo.types,
          isOpen: locationInfo.isOpen?.(new Date()),
          priceLevel: locationInfo.priceLevel
        };
      })
    );

    return formattedResults;
  } catch (error) {
    // Fall back to the older API if the new one fails
    console.warn('Falling back to legacy PlacesService API:', error);
    return legacySearchNearbyPlaces(center, type, radius, keyword);
  }
};

// Legacy function using the older PlacesService API as fallback
const legacySearchNearbyPlaces = async (
  center: { lat: number; lng: number },
  type: string = 'cafe',
  radius: number = 1000,
  keyword: string = ''
): Promise<PlaceResult[]> => {
  const service = new window.google.maps.places.PlacesService(
    document.createElement('div')
  );

  const request = {
    location: new window.google.maps.LatLng(center.lat, center.lng),
    radius,
    type,
    keyword,
  };

  return new Promise((resolve, reject) => {
    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const formattedResults: PlaceResult[] = results.map((place) => ({
          id: place.place_id || '',
          name: place.name || '',
          address: place.vicinity || '',
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
          rating: place.rating,
          photos: place.photos?.map((photo) => photo.getUrl({ maxWidth: 400, maxHeight: 300 })),
          types: place.types,
          isOpen: place.opening_hours?.isOpen?.(),
          priceLevel: place.price_level,
        }));
        resolve(formattedResults);
      } else {
        reject(new Error(`Places API failed with status: ${status}`));
      }
    });
  });
};

// Get details for a specific place using the newer Places API
export const getPlaceDetails = async (placeId: string): Promise<PlaceResult | null> => {
  if (!window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  try {
    // Use the newer Places API
    const { places } = window.google.maps.importLibrary('places') as any;
    
    // Fetch the place by ID
    const place = await places.fetchPlace({
      id: placeId,
      fields: ['displayName', 'formattedAddress', 'location', 'rating', 
               'types', 'priceLevel', 'photos', 'isOpen']
    });

    if (!place) {
      throw new Error('Place not found');
    }

    const placeData = place.place;
    return {
      id: placeId,
      name: placeData.displayName || '',
      address: placeData.formattedAddress || '',
      lat: placeData.location?.lat || 0,
      lng: placeData.location?.lng || 0,
      rating: placeData.rating,
      photos: placeData.photos?.map((photo: any) => photo.getUrl({ maxWidth: 400, maxHeight: 300 })),
      types: placeData.types,
      isOpen: placeData.isOpen?.(new Date()),
      priceLevel: placeData.priceLevel
    };
  } catch (error) {
    // Fall back to the older API if the new one fails
    console.warn('Falling back to legacy PlacesService API for details:', error);
    return legacyGetPlaceDetails(placeId);
  }
};

// Legacy function for getting place details as fallback
const legacyGetPlaceDetails = async (placeId: string): Promise<PlaceResult | null> => {
  const service = new window.google.maps.places.PlacesService(
    document.createElement('div')
  );

  return new Promise((resolve, reject) => {
    service.getDetails(
      { placeId, fields: ['name', 'formatted_address', 'geometry', 'photos', 'opening_hours', 'rating', 'types', 'price_level'] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const result: PlaceResult = {
            id: place.place_id || '',
            name: place.name || '',
            address: place.formatted_address || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            rating: place.rating,
            photos: place.photos?.map((photo) => photo.getUrl({ maxWidth: 400, maxHeight: 300 })),
            types: place.types,
            isOpen: place.opening_hours?.isOpen?.(),
            priceLevel: place.price_level,
          };
          resolve(result);
        } else {
          reject(new Error(`Place details API failed with status: ${status}`));
        }
      }
    );
  });
};

// Categories of places to meet
export const meetingPlaceCategories = [
  { value: 'cafe', label: 'Cafes', icon: 'coffee' },
  { value: 'restaurant', label: 'Restaurants', icon: 'utensils' },
  { value: 'library', label: 'Libraries', icon: 'book' },
  { value: 'bar', label: 'Bars', icon: 'glass-martini' },
  { value: 'park', label: 'Parks', icon: 'tree' },
  { value: 'book_store', label: 'Bookstores', icon: 'book-open' },
  { value: 'shopping_mall', label: 'Shopping Malls', icon: 'shopping-bag' },
  { value: 'movie_theater', label: 'Movie Theaters', icon: 'film' },
];

// Create a hook to use the places API
export const usePlacesAPI = () => {
  const { isLoaded } = useGoogleMaps();

  return {
    isLoaded,
    searchNearbyPlaces,
    getPlaceDetails,
    meetingPlaceCategories,
  };
}; 
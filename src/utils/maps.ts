import { Loader } from '@googlemaps/js-api-loader';

// Track loading status
let isLoading = false;
let isLoaded = false;

// Initialize the Google Maps loader
const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places'],
  region: 'US',
  language: 'en',
});

// Initialize the Google Maps service
let placesService: google.maps.places.PlacesService | null = null;
let autocompleteService: google.maps.places.AutocompleteService | null = null;

export const initializeMaps = async () => {
  try {
    // If already loaded or loading, don't initialize again
    if (isLoaded) {
      return true;
    }
    
    if (isLoading) {
      console.log('Google Maps initialization already in progress');
      // Wait for initialization to complete
      while (isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return isLoaded;
    }
    
    isLoading = true;
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded');
      isLoaded = true;
      isLoading = false;
      return true;
    }

    // Load Google Maps
    await loader.load();

    // Create a temporary map element if needed
    if (!placesService || !autocompleteService) {
      // Reuse existing hidden map if available
      let mapDiv = document.getElementById('google-maps-hidden');
      let shouldRemove = false;
      
      if (!mapDiv) {
        mapDiv = document.createElement('div');
        mapDiv.id = 'google-maps-hidden';
        mapDiv.style.width = '1px';
        mapDiv.style.height = '1px';
        mapDiv.style.position = 'absolute';
        mapDiv.style.top = '-9999px';
        mapDiv.style.left = '-9999px';
        document.body.appendChild(mapDiv);
        shouldRemove = true;
      }

      // Initialize services
      const map = new google.maps.Map(mapDiv, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      });

      placesService = new google.maps.places.PlacesService(map);
      autocompleteService = new google.maps.places.AutocompleteService();

      // Clean up if we created the element
      if (shouldRemove) {
        document.body.removeChild(mapDiv);
      }
    }

    isLoaded = true;
    isLoading = false;
    return true;
  } catch (error) {
    console.error('Error initializing Google Maps:', error);
    isLoading = false;
    return false;
  }
};

// Search for places based on query
export const searchPlaces = async (query: string, location: google.maps.LatLng) => {
  try {
    const request: google.maps.places.PlaceSearchRequest = {
      location,
      radius: 2000,
      keyword: query,
      type: 'cafe'
    };

    return new Promise((resolve, reject) => {
      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error('Failed to search places'));
        }
      });
    });
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

// Get place details
export const getPlaceDetails = async (placeId: string) => {
  try {
    return new Promise((resolve, reject) => {
      placesService.getDetails({ placeId }, (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error('Failed to get place details'));
        }
      });
    });
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

// Get place predictions for autocomplete
export const getPlacePredictions = async (input: string) => {
  try {
    return new Promise((resolve, reject) => {
      autocompleteService.getPlacePredictions(
        { input, types: ['establishment'] },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else {
            reject(new Error('Failed to get place predictions'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting place predictions:', error);
    throw error;
  }
};

// Format place for display
export const formatPlace = (place: google.maps.places.PlaceResult) => {
  return {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    rating: place.rating,
    type: place.types?.includes('cafe') ? 'cafe' : 'library',
    distance: '0.5 km', // This would be calculated based on user's location
    openingHours: place.opening_hours?.weekday_text,
    photos: place.photos?.map(photo => photo.getUrl())
  };
}; 
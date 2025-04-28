import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '@/providers/GoogleMapsProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

interface Location {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface MapLocationPickerProps {
  onLocationSelect: (location: Location) => void;
}

const MapLocationPicker = ({ onLocationSelect }: MapLocationPickerProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);

  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 15,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      setMap(newMap);

      // Initialize search box
      const searchBox = new window.google.maps.places.SearchBox(
        document.getElementById('search-input') as HTMLInputElement
      );
      searchBoxRef.current = searchBox;

      // Listen for places changed event
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry?.location) {
            const location = {
              placeId: place.place_id || '',
              name: place.name || '',
              address: place.formatted_address || '',
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            onLocationSelect(location);
            newMap.panTo(place.geometry.location);
          }
        }
      });
    }
  }, [isLoaded, map, onLocationSelect]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setUserLocation(location);
          map.panTo(location);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            toast('Location access denied. Please enable location services to find nearby places.');
          } else {
            toast('Geolocation is not supported by this browser.');
          }
        }
      );
    }
  }, [map, isLoaded]);

  const searchNearbyPlaces = async () => {
    if (!map || !window.google) return;

    setIsLoading(true);
    const location = userLocation || map.getCenter();
    
    try {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: location,
        radius: 2000,
        type: 'cafe',
        keyword: 'student friendly',
      };

      service.nearbySearch(request, (results, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.map((place) => ({
            placeId: place.place_id || '',
            name: place.name || '',
            address: place.vicinity || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          }));
          setSearchResults(places);
        } else {
          toast('No nearby places found. Try a different location.');
        }
      });
    } catch (error) {
      console.error('Error searching nearby places:', error);
      toast('Error searching for nearby places. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePlaceSelect = (place: Location) => {
    if (!map) return;
    
    const location = new window.google.maps.LatLng(place.lat, place.lng);
    map.panTo(location);
    
    // Clear existing markers
    if (selectedPlace) {
      const existingMarker = document.querySelector(`[data-place-id="${selectedPlace.placeId}"]`);
      if (existingMarker) {
        existingMarker.classList.remove('bg-primary', 'text-primary-foreground');
      }
    }

    // Create a marker for the selected place
    const marker = new window.google.maps.Marker({
      position: location,
      map: map,
      title: place.name,
      animation: window.google.maps.Animation.DROP
    });

    // Update the selected place
    setSelectedPlace(place);

    // Format the location data
    const locationData = {
      placeId: place.placeId,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng
    };

    onLocationSelect(locationData);
  };

  if (loadError) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading Google Maps: {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-2">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          id="search-input"
          type="text"
          placeholder="Search for a location..."
          className="w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div ref={mapRef} className="h-[300px] w-full rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={userLocation || defaultCenter}
          zoom={15}
          onLoad={setMap}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              }}
            />
          )}
        </GoogleMap>
      </div>

      <Button
        onClick={searchNearbyPlaces}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Searching...' : 'Find Nearby Places'}
      </Button>

      <div className="max-h-[300px] overflow-y-auto space-y-2">
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-2"
            >
              {searchResults.map((place) => (
                <motion.div
                  key={place.placeId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedPlace?.placeId === place.placeId
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => handlePlaceSelect(place)}
                  data-place-id={place.placeId}
                >
                  <h3 className="font-medium">{place.name}</h3>
                  <p className="text-sm">{place.address}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MapLocationPicker; 
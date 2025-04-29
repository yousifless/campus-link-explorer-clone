
import React, { useState, useRef, useEffect } from 'react';
import { 
  GoogleMap, 
  LoadScript, 
  Marker,
  Autocomplete
} from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Export interface for the component props
export interface MapLocationPickerProps {
  onLocationSelected: (location: any) => void;
}

interface Location {
  placeId: string;
  name: string;
  address: string;
  formatted_address: string; // Added to match usage in ScheduleMeetupModal
  lat: number;
  lng: number;
  geometry: { // Added to match usage in ScheduleMeetupModal
    location: {
      lat: () => number;
      lng: () => number;
    }
  };
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem'
};

const center = {
  lat: 35.6812,
  lng: 139.7671, // Default to Tokyo
};

const libraries: ("places")[] = ["places"];

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ onLocationSelected }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const location = {
          placeId: place.place_id,
          name: place.name || '',
          address: place.formatted_address || '',
          formatted_address: place.formatted_address || '', // Added to match usage in ScheduleMeetupModal
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          geometry: {
            location: {
              lat: () => place.geometry!.location!.lat(),
              lng: () => place.geometry!.location!.lng()
            }
          }
        };
        
        setMarkerPosition({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        
        setSelectedPlace(location);
        
        if (map) {
          map.panTo({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
          map.setZoom(15);
        }
      }
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      setMarkerPosition({ lat, lng });
      
      // Get address from coordinates using Geocoder
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const place = results[0];
          const placeName = place.address_components ? 
            place.address_components[0].long_name : 
            'Selected location';
            
          const location = {
            placeId: place.place_id,
            name: placeName,
            address: place.formatted_address || '',
            formatted_address: place.formatted_address || '', // Added to match usage in ScheduleMeetupModal
            lat,
            lng,
            geometry: {
              location: {
                lat: () => lat,
                lng: () => lng
              }
            }
          };
          
          setSelectedPlace(location);
        }
      });
    }
  };

  const handleSelectLocation = () => {
    if (selectedPlace) {
      onLocationSelected(selectedPlace);
    }
  };

  const onLoad = (map: google.maps.Map) => {
    setMap(map);
  };

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  return (
    <div className="space-y-4">
      <LoadScript 
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''} 
        libraries={libraries}
      >
        <div className="relative">
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={handlePlaceSelect}
            options={{ 
              types: ['establishment'],
              fields: ['place_id', 'geometry', 'name', 'formatted_address'] 
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for coffee shops or meeting places"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </Autocomplete>
        </div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          onClick={handleMapClick}
          onLoad={onLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </LoadScript>

      {selectedPlace && (
        <Card className="overflow-hidden border-blue-100 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mt-1">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-medium">{selectedPlace.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
                <Button 
                  onClick={handleSelectLocation}
                  className="mt-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Select This Location
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MapLocationPicker;

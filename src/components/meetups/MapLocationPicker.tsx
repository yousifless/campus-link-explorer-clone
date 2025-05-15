import React, { useState, useRef, useEffect } from 'react';
import { 
  GoogleMap, 
  Marker,
  Autocomplete,
  MarkerClusterer
} from '@react-google-maps/api';
import { useGoogleMaps, googleMapsLibraries } from '@/providers/GoogleMapsProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Export interface for the component props
export interface MapLocationPickerProps {
  onLocationSelected: (location: any) => void;
}

interface Location {
  placeId: string;
  name: string;
  address: string;
  formatted_address: string;
  lat: number;
  lng: number;
  geometry: {
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

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ onLocationSelected }) => {
  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);
  const [showNearby, setShowNearby] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const location = {
          placeId: place.place_id,
          name: place.name || '',
          address: place.formatted_address || '',
          formatted_address: place.formatted_address || '',
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
            formatted_address: place.formatted_address || '',
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

  // Show nearby cafes and libraries
  const handleShowNearby = async () => {
    if (!map) return;
    setLoadingNearby(true);
    setNearbyError(null);
    setNearbyPlaces([]);
    const service = new window.google.maps.places.PlacesService(map);
    const allResults: any[] = [];
    let completed = 0;
    const types = ['cafe', 'library'];
    types.forEach((type) => {
      const request = {
        location: map.getCenter(),
        radius: 1500, // 1.5km
        type,
        keyword: type,
      };
      service.nearbySearch(request, (results, status) => {
        completed++;
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          allResults.push(...results);
        }
        if (completed === types.length) {
          setLoadingNearby(false);
          if (allResults.length > 0) {
            setNearbyPlaces(allResults);
          } else {
            setNearbyError('No nearby cafes or libraries found.');
          }
        }
      });
    });
  };

  // Get user's current location for distance calculation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => setUserLocation(null)
      );
    }
  }, []);

  // Helper to calculate distance in meters
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3; // meters
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showNearby ? 'default' : 'outline'}
                onClick={() => {
                  setShowNearby((prev) => !prev);
                  if (!showNearby) handleShowNearby();
                }}
                className="rounded-full px-4"
                aria-pressed={showNearby}
              >
                {showNearby ? 'Hide Cafes & Libraries' : 'Show Cafes & Libraries Nearby'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Find nearby coffee shops and libraries for your meetup. Click to toggle markers and see a list below.</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {loadingNearby && <Loader2 className="h-5 w-5 animate-spin text-blue-600 ml-2" />}
        {nearbyError && <span className="text-xs text-red-500 ml-2">{nearbyError}</span>}
      </div>
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
        {showNearby && (
          <MarkerClusterer>
            {(clusterer) => (
              <>
                {nearbyPlaces.map((place, idx) => (
                  <Marker
                    key={place.place_id || idx}
                    position={{
                      lat: place.geometry.location.lat(),
                      lng: place.geometry.location.lng(),
                    }}
                    icon={{
                      url: place.types.includes('cafe')
                        ? 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/cafe-71.png'
                        : 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/library-71.png',
                      scaledSize: new window.google.maps.Size(32, 32),
                    }}
                    title={place.name}
                    clusterer={clusterer}
                    onClick={() => setSelectedMarker(place)}
                  />
                ))}
              </>
            )}
          </MarkerClusterer>
        )}
        {/* Info window for selected marker */}
        {selectedMarker && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '10%',
              zIndex: 1000,
              transform: 'translate(-50%, 0)',
            }}
            className="bg-white rounded-lg shadow-lg p-4 max-w-xs border border-blue-200"
          >
            <div className="font-semibold text-blue-700 mb-1">{selectedMarker.name}</div>
            <div className="text-xs text-gray-700 mb-1">{selectedMarker.vicinity || selectedMarker.formatted_address}</div>
            {userLocation && (
              <div className="text-xs text-gray-500 mb-1">
                {Math.round(getDistance(userLocation.lat, userLocation.lng, selectedMarker.geometry.location.lat(), selectedMarker.geometry.location.lng()) / 10) / 100} km away
              </div>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedMarker.name + ' ' + (selectedMarker.vicinity || selectedMarker.formatted_address))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline"
            >
              Get Directions
            </a>
            <Button size="sm" className="mt-2 w-full" onClick={() => setSelectedMarker(null)}>
              Close
            </Button>
          </div>
        )}
      </GoogleMap>

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

      {/* Dropdown list of places */}
      {showNearby && nearbyPlaces.length > 0 && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Nearby Cafes & Libraries</div>
          <div className="max-h-48 overflow-y-auto border rounded-lg bg-white shadow-sm divide-y">
            {nearbyPlaces.map((place, idx) => (
              <div
                key={place.place_id || idx}
                className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer"
                onClick={() => {
                  setMarkerPosition({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                  setSelectedMarker(place);
                  if (map) map.panTo({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  });
                }}
                tabIndex={0}
                aria-label={`Show details for ${place.name}`}
              >
                <div>
                  <div className="font-medium text-sm text-blue-900">{place.name}</div>
                  <div className="text-xs text-gray-500">{place.types.includes('cafe') ? 'Cafe' : 'Library'}</div>
                  {userLocation && (
                    <div className="text-xs text-gray-400">
                      {Math.round(getDistance(userLocation.lat, userLocation.lng, place.geometry.location.lat(), place.geometry.location.lng()) / 10) / 100} km away
                    </div>
                  )}
                </div>
                <div className="text-xs text-blue-600 underline">Show</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;

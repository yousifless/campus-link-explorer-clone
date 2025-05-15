import React, { useState, useEffect } from 'react';
import { usePlacesAPI, PlaceResult, meetingPlaceCategories } from '@/services/places-api';
import { CheckCircle2, Coffee, Map, MapPin, Search, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Badge } from '@/components/ui/badge';

interface NearbyPlacesSelectorProps {
  onSelectPlace: (place: PlaceResult) => void;
  initialLocation?: { lat: number; lng: number } | null;
  showCafesOnly?: boolean;
}

export const NearbyPlacesSelector: React.FC<NearbyPlacesSelectorProps> = ({
  onSelectPlace,
  initialLocation,
  showCafesOnly = false,
}) => {
  const { isLoaded, searchNearbyPlaces } = usePlacesAPI();
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [placeType, setPlaceType] = useState(showCafesOnly ? 'cafe' : 'cafe');
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);

  // Get current location if not provided
  useEffect(() => {
    if (!currentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to a central location if geolocation fails
          setCurrentLocation({ lat: 35.6895, lng: 139.6917 }); // Tokyo
        }
      );
    }
  }, [currentLocation]);

  // Search for nearby places when location is set or type changes
  useEffect(() => {
    if (isLoaded && currentLocation) {
      fetchNearbyPlaces();
    }
  }, [isLoaded, currentLocation, placeType]);

  const fetchNearbyPlaces = async () => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      const results = await searchNearbyPlaces(
        currentLocation,
        placeType,
        1500,
        searchQuery
      );
      setPlaces(results);
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      setError('Failed to load nearby places. Please try again.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNearbyPlaces();
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setSelectedPlace(place);
    onSelectPlace(place);
    
    // Center map on selected place
    if (mapRef && place) {
      mapRef.panTo({ lat: place.lat, lng: place.lng });
    }
  };

  const handleMapLoad = (map: google.maps.Map) => {
    setMapRef(map);
  };

  const renderRatingStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="ml-1 text-xs">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderPlaceCard = (place: PlaceResult) => {
    const isSelected = selectedPlace?.id === place.id;
    
    return (
      <Card 
        key={place.id}
        className={`mb-2 overflow-hidden hover:border-blue-300 transition-colors cursor-pointer ${
          isSelected ? 'border-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => handleSelectPlace(place)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {place.photos && place.photos.length > 0 ? (
              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={place.photos[0]} 
                  alt={place.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                <Coffee className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-medium truncate">{place.name}</h4>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-gray-500 line-clamp-2">{place.address}</p>
              
              <div className="flex justify-between items-center mt-1">
                {renderRatingStars(place.rating)}
                
                {place.isOpen !== undefined && (
                  <span className={`text-xs ${place.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                    {place.isOpen ? 'Open' : 'Closed'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Show loading state while waiting for the Google Maps API or location
  if (!isLoaded || (!currentLocation && !initialLocation)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[300px] w-full" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        {!showCafesOnly && (
          <Tabs value={placeType} onValueChange={setPlaceType} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="cafe">Cafes</TabsTrigger>
              <TabsTrigger value="restaurant">Restaurants</TabsTrigger>
              <TabsTrigger value="library">Libraries</TabsTrigger>
              <TabsTrigger value="bar">Bars</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Search nearby places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-[300px] rounded-md overflow-hidden">
          {currentLocation && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={currentLocation}
              zoom={14}
              onLoad={handleMapLoad}
            >
              {/* Current location marker */}
              <Marker
                position={currentLocation}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new google.maps.Size(32, 32),
                }}
              />
              
              {/* Place markers */}
              {places.map((place) => (
                <Marker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  onClick={() => {
                    setSelectedPlace(place);
                    setInfoWindowOpen(true);
                  }}
                  animation={selectedPlace?.id === place.id ? google.maps.Animation.BOUNCE : undefined}
                />
              ))}
              
              {/* Info window for selected place */}
              {selectedPlace && infoWindowOpen && (
                <InfoWindow
                  position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                  onCloseClick={() => setInfoWindowOpen(false)}
                >
                  <div className="p-1">
                    <h3 className="font-medium text-sm">{selectedPlace.name}</h3>
                    <p className="text-xs">{selectedPlace.address}</p>
                    {renderRatingStars(selectedPlace.rating)}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-1 text-xs h-7 w-full"
                      onClick={() => handleSelectPlace(selectedPlace)}
                    >
                      Select This Place
                    </Button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
        
        <div>
          <h3 className="font-medium mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            Nearby {placeType === 'cafe' ? 'Cafes' : placeType === 'restaurant' ? 'Restaurants' : placeType === 'library' ? 'Libraries' : 'Locations'}
            <Badge variant="outline" className="ml-2">
              {places.length} found
            </Badge>
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : places.length > 0 ? (
            <ScrollArea className="h-[250px] rounded border p-2">
              {places.map(renderPlaceCard)}
            </ScrollArea>
          ) : (
            <div className="h-[250px] rounded border p-4 flex flex-col items-center justify-center text-center">
              <Map className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No places found nearby</p>
              <p className="text-xs text-gray-400">Try a different search or change the location</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyPlacesSelector; 
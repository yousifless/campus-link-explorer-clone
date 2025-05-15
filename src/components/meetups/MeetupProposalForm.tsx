import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import NearbyPlacesSelector from '@/components/shared/NearbyPlacesSelector';
import { PlaceResult } from '@/services/places-api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Edit, Map, Coffee, BookOpen, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGoogleMaps } from '@/providers/GoogleMapsProvider';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface MeetupProposalFormProps {
  matchId: string;
  receiverId: string;
  selectedDate: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

// Define the proper type for createMeetup's parameters
interface MeetupProposal {
  match_id: string;
  receiver_id: string;
  date: string;
  message?: string;
  location_name: string;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
}

// Import the actual service function
import { createMeetup as createMeetupService } from '@/services/coffee-meetups';

export const MeetupProposalForm: React.FC<MeetupProposalFormProps> = ({
  matchId,
  receiverId,
  selectedDate,
  onSuccess,
  onCancel
}) => {
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('cafes');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [useMapSelector, setUseMapSelector] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const { isLoaded } = useGoogleMaps();
  const { toast } = useToast();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Get user's current location when the component mounts
  useEffect(() => {
    if (navigator.geolocation && !currentLocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeoLoading(false);
        },
        (error) => {
          setGeoError('Unable to access your location. Using default location.');
          setGeoLoading(false);
          setCurrentLocation({ lat: 35.6895, lng: 139.6917 }); // Tokyo as default
        }
      );
    }
  }, []);

  const handleSelectPlace = (place: PlaceResult) => {
    setSelectedPlace(place);
    setLocation(place.name);
    setAddress(place.address);
    setCoordinates({ lat: place.lat, lng: place.lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate location
    if (!location || !address) {
      toast({
        title: "Missing location",
        description: "Please select or enter a meeting location",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await createMeetupService({
        match_id: matchId,
        receiver_id: receiverId,
        date: selectedDate.toISOString(),
        location_name: location,
        location_address: address,
        location_lat: coordinates?.lat,
        location_lng: coordinates?.lng,
        message
      });

      toast({
        title: "Success",
        description: "Meetup proposal sent successfully",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send meetup proposal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold">
        Propose Meetup for {format(selectedDate, 'MMMM d, yyyy')}
      </h3>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="use-map" 
            checked={useMapSelector} 
            onCheckedChange={setUseMapSelector} 
          />
          <Label htmlFor="use-map">Find location on map</Label>
        </div>
      </div>

      {geoLoading && (
        <div className="flex items-center text-blue-600 text-sm mb-2">
          <Loader2 className="animate-spin mr-2 h-4 w-4" /> Detecting your location...
        </div>
      )}
      {geoError && (
        <div className="text-xs text-red-500 mb-2">{geoError}</div>
      )}

      {useMapSelector ? (
        <div className="space-y-4">
          <Tabs defaultValue="cafes" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cafes" className="flex items-center">
                <Coffee className="mr-2 h-4 w-4" />
                Nearby Cafes
              </TabsTrigger>
              <TabsTrigger value="libraries" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Libraries
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cafes" className="mt-4">
              <NearbyPlacesSelector 
                onSelectPlace={handleSelectPlace} 
                showCafesOnly={true}
                initialLocation={currentLocation}
              />
            </TabsContent>
            <TabsContent value="libraries" className="mt-4">
              <NearbyPlacesSelector 
                onSelectPlace={handleSelectPlace}
                showCafesOnly={false}
                initialLocation={currentLocation}
              />
            </TabsContent>
          </Tabs>
          
          {selectedPlace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md"
            >
              <h4 className="font-medium text-sm">Selected Location:</h4>
              <p className="text-sm font-semibold text-blue-900">{selectedPlace.name}</p>
              <p className="text-xs text-gray-500">{selectedPlace.address}</p>
            </motion.div>
          )}
          
          {/* Map preview if coordinates are set */}
          {coordinates && isLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-[200px] mt-4 rounded-md overflow-hidden border"
            >
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={coordinates}
                zoom={15}
                options={{
                  disableDefaultUI: true,
                  gestureHandling: 'greedy',
                  clickableIcons: false,
                }}
              >
                <Marker position={coordinates} />
              </GoogleMap>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              Location Name
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter meeting location name"
              required
            />
          </div>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Address
            </label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter the full address"
              required
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Message (Optional)
        </label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message for your match"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !location}
        >
          {isSubmitting ? 'Sending...' : 'Send Proposal'}
        </Button>
      </div>
    </motion.div>
  );
}; 

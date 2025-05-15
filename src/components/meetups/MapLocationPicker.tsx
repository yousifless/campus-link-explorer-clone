
import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Update the props interface to include onLocationChange
export interface MapLocationPickerProps {
  defaultLocation?: {
    lat: number;
    lng: number;
  };
  onLocationChange?: (location: any) => void;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  defaultLocation,
  onLocationChange
}) => {
  const [location, setLocation] = useState(defaultLocation || { lat: 40.7128, lng: -74.006 });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Update the parent component when location changes
  useEffect(() => {
    if (onLocationChange && location) {
      onLocationChange(location);
    }
  }, [location, onLocationChange]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setLocation(newLocation);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const { location } = results[0].geometry;
          setLocation({
            lat: location.lat(),
            lng: location.lng()
          });
        }
      });
    } catch (error) {
      console.error("Error searching for location:", error);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex mb-2">
        <Input
          type="text"
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mr-2"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} type="button">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div style={{ height: '300px', width: '100%' }} className="rounded-md overflow-hidden">
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%' }}
            center={location}
            zoom={14}
            onClick={handleMapClick}
          >
            <Marker position={location} />
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default MapLocationPicker;

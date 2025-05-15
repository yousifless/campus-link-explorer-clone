import React from 'react';
import { useLoadScript, Libraries } from '@react-google-maps/api';

// Define the libraries constant outside to prevent recreation on every render
export const googleMapsLibraries: Libraries = ['places'];

// Create a context for Google Maps
export const GoogleMapsContext = React.createContext({ isLoaded: false, loadError: null });

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: googleMapsLibraries,
  });

  const value = React.useMemo(() => {
    return { isLoaded, loadError };
  }, [isLoaded, loadError]);

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

// Custom hook to use Google Maps context
export const useGoogleMaps = () => {
  const context = React.useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}; 
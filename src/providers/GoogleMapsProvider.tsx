import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeMaps } from '@/utils/maps';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const success = await initializeMaps();
        setIsLoaded(success);
        if (!success) {
          setLoadError(new Error('Failed to initialize Google Maps'));
        }
      } catch (error) {
        setLoadError(error as Error);
      }
    };

    loadGoogleMaps();
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}; 
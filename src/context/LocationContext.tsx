// src/context/LocationContext.tsx
// No route - Context provider
// Manages player location tracking and updates

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { LocationData } from '../services/LocationService';

interface LocationContextType {
  location: LocationData | null;
  heading: number | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || 0,
      accuracy: position.coords.accuracy
    });
    setHeading(position.coords.heading || null);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => console.error('Error watching position:', error)
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [handlePositionUpdate]);

  return (
    <LocationContext.Provider value={{ location, heading }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;
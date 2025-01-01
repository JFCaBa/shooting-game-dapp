// src/context/LocationContext.tsx
// No route - Context provider
// Manages player location tracking and updates

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LocationData } from '../types/game';

interface LocationState {
  location: LocationData | null;
  heading: number;
  accuracy: number;
  watching: boolean;
  error: GeolocationPositionError | null;
}

interface LocationContextType extends LocationState {
  startWatching: () => void;
  stopWatching: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LocationState>({
    location: null,
    heading: 0,
    accuracy: 0,
    watching: false,
    error: null
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const handlePositionUpdate = (position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude || 0,
        accuracy: position.coords.accuracy
      },
      accuracy: position.coords.accuracy,
      error: null
    }));
  };

  const handleError = (error: GeolocationPositionError) => {
    setState(prev => ({ ...prev, error }));
  };

  const startWatching = () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: new GeolocationPositionError()
      }));
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handlePositionUpdate, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    setWatchId(id);
    setState(prev => ({ ...prev, watching: true }));

    // Setup device orientation if available
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleOrientation);
    }
  };

  const stopWatching = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setState(prev => ({ ...prev, watching: false }));

    // Remove orientation listener
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.absolute && event.alpha !== null) {
      setState(prev => ({ ...prev, heading: event.alpha }));
    }
  };

  useEffect(() => {
    // Cleanup function when component unmounts
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  const value: LocationContextType = {
    ...state,
    startWatching,
    stopWatching
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;
import React, { createContext, useContext, useEffect, useState } from 'react';
import { LocationData } from '../types/game';
import { LocationStateManager } from '../services/LocationStateManager';

interface LocationContextType {
  location: LocationData | null;
  heading: number | null;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    const locationManager = LocationStateManager.getInstance();

    // Initialize with current values
    setLocation(locationManager.getCurrentLocation());
    setHeading(locationManager.getCurrentHeading());

    // Subscribe to updates
    const unsubLocation = locationManager.subscribeToLocation((newLocation) => {
      setLocation(newLocation);
    });

    const unsubHeading = locationManager.subscribeToHeading((newHeading) => {
      setHeading(newHeading);
    });

    return () => {
      unsubLocation();
      unsubHeading();
    };
  }, []);

  const value = {
    location,
    heading,
  };

  // We can now safely provide these values as they'll be consistently available
  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error(
      'useLocationContext must be used within a LocationProvider'
    );
  }
  return context;
};

// Add a direct way to get the current location without context
export const getCurrentLocation = (): LocationData | null => {
  return LocationStateManager.getInstance().getCurrentLocation();
};

export default LocationContext;

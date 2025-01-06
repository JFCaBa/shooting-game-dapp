import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { LocationData } from '../services/LocationService';
import { HeadingService } from '../services/HeadingService';

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
  const headingService = HeadingService.getInstance();

  // Watch position updates
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || 0,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => console.error('Error watching position:', error)
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Watch heading updates
  useEffect(() => {
    const updateHeading = () => {
      const newHeading = headingService.getHeading();
      if (newHeading !== null) {
        setHeading(newHeading);
      }
    };

    // Update heading every 100ms
    const intervalId = setInterval(updateHeading, 100);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <LocationContext.Provider value={{ location, heading }}>
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

export default LocationContext;

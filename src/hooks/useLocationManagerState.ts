import { useState, useEffect } from 'react';
import { LocationStateManager } from '../services/LocationStateManager';

export const useLocationManager = () => {
  const [locationManager] = useState<LocationStateManager>(() =>
    LocationStateManager.getInstance()
  );

  return locationManager;
};

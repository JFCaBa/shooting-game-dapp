import { LocationData } from '../types/game';

type LocationUpdateCallback = (location: LocationData) => void;
type HeadingUpdateCallback = (heading: number) => void;

export class LocationStateManager {
  private static instance: LocationStateManager;
  private currentLocation: LocationData | null = null;
  private currentHeading: number | null = null;
  private locationCallbacks: Set<LocationUpdateCallback> = new Set();
  private headingCallbacks: Set<HeadingUpdateCallback> = new Set();
  private watchId: number | null = null;

  private constructor() {
    this.initializeGeolocation();
  }

  // MARK: - getInstance
  public static getInstance(): LocationStateManager {
    if (!LocationStateManager.instance) {
      LocationStateManager.instance = new LocationStateManager();
    }
    return LocationStateManager.instance;
  }

  // MARK: - initializeGeolocation
  private initializeGeolocation(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      this.handlePositionUpdate.bind(this),
      this.handleError.bind(this),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    // Set up continuous watching
    this.watchId = navigator.geolocation.watchPosition(
      this.handlePositionUpdate.bind(this),
      this.handleError.bind(this),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    // Set up device orientation if available
    if (window.DeviceOrientationEvent) {
      window.addEventListener(
        'deviceorientation',
        this.handleOrientation.bind(this),
        true
      );
    }
  }

  // MARK: - handlePositionUpdate
  private handlePositionUpdate(position: GeolocationPosition): void {
    const newLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || 0,
      accuracy: position.coords.accuracy,
    };

    this.currentLocation = newLocation;

    // Notify all subscribers
    this.locationCallbacks.forEach((callback) => callback(newLocation));
  }

  // MARK: - handleOrientation
  private handleOrientation(event: DeviceOrientationEvent): void {
    if (event.alpha !== null) {
      this.currentHeading = event.alpha;
      this.headingCallbacks.forEach((callback) => callback(event.alpha));
    }
  }

  // MARK: - handleError
  private handleError(error: GeolocationPositionError): void {
    console.error('LocationStateManager: Error getting position:', error);
  }

  // MARK: - getCurrentLocation
  public getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  // MARK: - getCurrentHeading
  public getCurrentHeading(): number | null {
    return this.currentHeading;
  }

  // MARK: - subscribeToLocation
  public subscribeToLocation(callback: LocationUpdateCallback): () => void {
    this.locationCallbacks.add(callback);
    // If we have a current location, immediately notify the new subscriber
    if (this.currentLocation) {
      callback(this.currentLocation);
    }
    return () => this.locationCallbacks.delete(callback);
  }

  // MARK: - subscribeToHeading
  public subscribeToHeading(callback: HeadingUpdateCallback): () => void {
    this.headingCallbacks.add(callback);
    // If we have a current heading, immediately notify the new subscriber
    if (this.currentHeading !== null) {
      callback(this.currentHeading);
    }
    return () => this.headingCallbacks.delete(callback);
  }

  // MARK: - cleanup
  public cleanup(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    window.removeEventListener(
      'deviceorientation',
      this.handleOrientation.bind(this),
      true
    );
    this.locationCallbacks.clear();
    this.headingCallbacks.clear();
  }
}

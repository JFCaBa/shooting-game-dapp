import { calculateDistance } from '../utils/maths';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
}

export class LocationService {
  private static instance: LocationService;

  private constructor() {}

  // MARK: - getInstance
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // MARK: - validateHit
  validateHit(
    shooter: LocationData,
    target: LocationData,
    maxRange: number
  ): boolean {
    const distance = calculateDistance(shooter, target);
    return distance <= maxRange;
  }

  // MARK: - getCurrentLocation
  getCurrentLocation(): Promise<LocationData> {
    console.log('Fetching location');
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || 0,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  // getCurrentLocation(): Promise<LocationData> {
  //   console.log('Getting current location...');
  //   return new Promise((resolve, reject) => {
  //     if (!navigator.geolocation) {
  //       console.error('Geolocation is not supported by this browser.');
  //       reject(new Error('Geolocation is not supported by this browser.'));
  //       return;
  //     }

  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
  //         console.log('Position obtained:', position);
  //         resolve({
  //           latitude: position.coords.latitude,
  //           longitude: position.coords.longitude,
  //           altitude: position.coords.altitude || 0,
  //           accuracy: position.coords.accuracy,
  //         });
  //       },
  //       (error) => {
  //         console.error('Error getting position:', error);
  //         reject(error);
  //       },
  //       {
  //         enableHighAccuracy: true,
  //         timeout: 10000,
  //         maximumAge: 0,
  //       }
  //     );
  //   });
  // }

  getCurrentHeading(): Promise<number> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.watchPosition(
        (position) => {
          if (position.coords.heading !== null) {
            resolve(position.coords.heading);
          } else {
            reject(new Error('Heading is not available'));
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }
}

export const locationService = LocationService.getInstance();

// src/services/LocationService.ts
// Handles location calculations and validations

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
}

export class LocationService {
  private static instance: LocationService;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  calculateDistance(from: LocationData, to: LocationData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(from.latitude);
    const φ2 = this.toRadians(to.latitude);
    const Δφ = this.toRadians(to.latitude - from.latitude);
    const Δλ = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  calculateBearing(from: LocationData, to: LocationData): number {
    const φ1 = this.toRadians(from.latitude);
    const φ2 = this.toRadians(to.latitude);
    const Δλ = this.toRadians(to.longitude - from.longitude);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (this.toDegrees(θ) + 360) % 360;
  }

  validateHit(
    shooter: LocationData,
    target: LocationData,
    maxRange: number
  ): boolean {
    const distance = this.calculateDistance(shooter, target);
    return distance <= maxRange;
  }

  toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

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

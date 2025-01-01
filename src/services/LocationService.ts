// src/services/LocationService.ts
// Handles location calculations and validations

import { LocationData } from '../types/game';

export class LocationService {
  private static instance: LocationService;

  constructor() {}

  static getInstance(): LocationService {
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

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateBearing(from: LocationData, to: LocationData): number {
    const φ1 = this.toRadians(from.latitude);
    const φ2 = this.toRadians(to.latitude);
    const Δλ = this.toRadians(to.longitude - from.longitude);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
             Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    const θ = Math.atan2(y, x);
    return (this.toDegrees(θ) + 360) % 360;
  }

  validateHit(shooter: LocationData, target: LocationData, maxRange: number): boolean {
    const distance = this.calculateDistance(shooter, target);
    return distance <= maxRange;
  }

  public toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  public toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || 0,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }
}

export const locationService = new LocationService();
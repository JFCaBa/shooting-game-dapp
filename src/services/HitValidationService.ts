// src/services/HitValidationService.ts
// Validates hit detection and damage calculations

import { LocationData } from '../types/game';
import { LocationService } from './LocationService';
import { calculateDistance, calculateBearing, toRadians } from '../utils/maths';

interface HitValidation {
  isValid: boolean;
  damage: number;
  distance: number;
  deviation: number;
}

export class HitValidationService {
  private static instance: HitValidationService;
  private locationService: LocationService;

  private readonly MAX_RANGE = 500; // meters
  private readonly MAX_ANGLE_ERROR = 30; // degrees
  private readonly BASE_DAMAGE = 1;

  private constructor() {
    this.locationService = LocationService.getInstance();
  }

  static getInstance(): HitValidationService {
    if (!HitValidationService.instance) {
      HitValidationService.instance = new HitValidationService();
    }
    return HitValidationService.instance;
  }

  validateHit(
    shooter: LocationData,
    shooterHeading: number,
    target: LocationData
  ): HitValidation {
    if (!target) {
      return {
        isValid: false,
        damage: 0,
        distance: 0,
        deviation: 0,
      };
    }

    const distance = calculateDistance(shooter, target);

    // Check if target is in range
    if (distance > this.MAX_RANGE) {
      return {
        isValid: false,
        damage: 0,
        distance,
        deviation: 0,
      };
    }

    // Calculate actual bearing to target
    const actualBearing = calculateBearing(shooter, target);

    // Calculate angle difference
    let angleDiff = Math.abs(shooterHeading - actualBearing);
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff;
    }

    // Calculate deviation in meters
    const deviation = distance * Math.tan(toRadians(angleDiff));

    // Validate hit based on angle difference
    const isValid = angleDiff <= this.MAX_ANGLE_ERROR;

    // Calculate damage based on distance (closer = more damage)
    const damage = isValid ? this.calculateDamage(distance) : 0;

    return {
      isValid,
      damage,
      distance,
      deviation,
    };
  }

  private calculateDamage(distance: number): number {
    // Damage decreases linearly with distance
    const damageFalloff = 1 - distance / this.MAX_RANGE;
    return Math.max(this.BASE_DAMAGE * damageFalloff, this.BASE_DAMAGE);
  }
}

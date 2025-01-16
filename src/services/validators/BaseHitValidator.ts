// src/services/validators/BaseHitValidator.ts
import { LocationData } from '../../types/game';
import { HitValidation } from '../../types/validation';
import {
  calculateDistance,
  calculateBearing,
  toRadians,
} from '../../utils/maths';

export abstract class BaseHitValidator {
  protected readonly MAX_RANGE = 500; // meters
  protected readonly MAX_ANGLE_ERROR = 30; // degrees
  protected readonly BASE_DAMAGE = 1;

  protected calculateBaseValidation(
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

  protected calculateDamage(distance: number): number {
    const damageFalloff = 1 - distance / this.MAX_RANGE;
    return Math.max(this.BASE_DAMAGE * damageFalloff, this.BASE_DAMAGE);
  }
}

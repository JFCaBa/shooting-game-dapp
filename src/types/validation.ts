// src/types/validation.ts
import { LocationData } from './game';

export interface HitValidation {
  isValid: boolean;
  damage: number;
  distance: number;
  deviation: number;
}

export interface IHitValidator {
  validateHit(
    shooter: LocationData,
    shooterHeading: number,
    target: LocationData,
    targetType: 'player' | 'drone' | 'geoObject',
    cameraFeed?: ImageData
  ): Promise<HitValidation>;
}

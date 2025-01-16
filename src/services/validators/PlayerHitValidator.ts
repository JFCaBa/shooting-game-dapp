// src/services/validators/PlayerHitValidator.ts
import { LocationData } from '../../types/game';
import { HitValidation } from '../../types/validation';
import { BaseHitValidator } from './BaseHitValidator';
import { PersonDetector } from '../PersonDetector';

export class PlayerHitValidator extends BaseHitValidator {
  constructor(private personDetector: PersonDetector) {
    super();
  }

  // MARK: - validateHit
  async validateHit(
    shooter: LocationData,
    shooterHeading: number,
    target: LocationData,
    cameraFeed?: ImageData
  ): Promise<HitValidation> {
    const baseValidation = this.calculateBaseValidation(
      shooter,
      shooterHeading,
      target
    );

    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Calculate crosshair position
    const crosshairX = window.innerWidth / 2; // Center horizontally
    const crosshairY = window.innerHeight * 0.33; // 33% from the top

    // Check if the crosshair is inside any person box
    const isHitValid = await this.personDetector.isPointInPersonBox(
      crosshairX,
      crosshairY
    );

    return {
      ...baseValidation,
      isValid: baseValidation.isValid && isHitValid,
    };
  }
}

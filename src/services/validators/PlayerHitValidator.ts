// src/services/validators/PlayerHitValidator.ts
import { LocationData } from '../../types/game';
import { HitValidation } from '../../types/validation';
import { BaseHitValidator } from './BaseHitValidator';
import { PersonDetector } from '../PersonDetector';

export class PlayerHitValidator extends BaseHitValidator {
  constructor(private personDetector: PersonDetector) {
    super();
  }

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

    // Additional player-specific validation
    const isPersonDetected = await this.personDetector.detectPerson();

    return {
      ...baseValidation,
      isValid: baseValidation.isValid && isPersonDetected,
    };
  }
}

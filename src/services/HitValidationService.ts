// src/services/HitValidationService.ts
import { LocationData } from '../types/game';
import { HitValidation } from '../types/validation';
import { PlayerHitValidator } from './validators/PlayerHitValidator';
import { PersonDetector } from './PersonDetector';

export class HitValidationService {
  private playerValidator: PlayerHitValidator;

  constructor() {
    const personDetector = new PersonDetector();
    this.playerValidator = new PlayerHitValidator(personDetector);
  }

  // MARK: - validateHit
  async validateHit(
    shooter: LocationData,
    shooterHeading: number,
    target: LocationData,
    targetType: 'player' | 'drone' | 'geoObject' = 'player',
    cameraFeed?: ImageData
  ): Promise<HitValidation> {
    // For backward compatibility, default to player validation
    if (targetType === 'player') {
      return this.playerValidator.validateHit(
        shooter,
        shooterHeading,
        target,
        cameraFeed
      );
    }

    // For other types, just use the base validation for now
    return this.playerValidator.validateHit(shooter, shooterHeading, target);
  }
}

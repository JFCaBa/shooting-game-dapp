import { GameState } from '../types/gameContext';
import { WebSocketService } from './WebSocketService';
import {
  GameMessage,
  MessageType,
  LocationData,
  ShootData,
} from '../types/game';
import { RELOAD_TIME, RESPAWN_TIME } from '../types/gameContext';

export class GameStateService {
  private isShooting: boolean = false;
  private wsInstance: WebSocketService;
  private setState: (
    state: GameState | ((prevState: GameState) => GameState)
  ) => void;

  constructor(
    wsInstance: WebSocketService,
    setState: (state: GameState | ((prevState: GameState) => GameState)) => void
  ) {
    this.wsInstance = wsInstance;
    this.setState = setState;
  }

  // MARK: - sendReloadRequest
  public sendReloadRequest(playerId: string): void {
    const reloadMessage: GameMessage = {
      type: MessageType.RELOAD,
      playerId: playerId,
    };
    this.wsInstance.send(reloadMessage);
  }

  // MARK: - sendRecoverRequest
  public sendRecoverRequest(playerId: string): void {
    const recoverMessage: GameMessage = {
      type: MessageType.RECOVER,
      playerId: playerId,
    };
    this.wsInstance.send(recoverMessage);
  }

  // MARK: - performReload
  public performReload(playerId: string): void {
    this.setState((prev) => {
      if (prev.isReloading) {
        return prev;
      }
      return { ...prev, isReloading: true };
    });

    setTimeout(() => {
      this.sendReloadRequest(playerId);
    }, RELOAD_TIME);
  }

  // MARK: - performRecover
  public performRecover(playerId: string): void {
    this.setState((prev) => {
      if (prev.isRecovering) {
        return prev;
      }
      return { ...prev, isRecovering: true, isAlive: false };
    });

    setTimeout(() => {
      this.sendRecoverRequest(playerId);
    }, RELOAD_TIME);
  }

  // MARK: - handleAdReward
  public handleAdReward(playerId: string): void {
    this.setState((prev) => {
      switch (prev.showAdModal) {
        case 'ammo':
          this.performReload(playerId);
          return {
            ...prev,
            showAdModal: null,
          };

        case 'lives':
          this.performRecover(playerId);
          return {
            ...prev,
            showAdModal: null,
          };
        default:
          return prev;
      }
    });
  }

  // MARK: - closeAdModal
  public closeAdModal(playerId: string): void {
    this.setState((prev) => {
      if (prev.showAdModal === 'ammo') {
        this.performReload(playerId);
        return {
          ...prev,
          showAdModal: null,
          isReloading: true,
        };
      }

      if (prev.showAdModal === 'lives') {
        this.performRecover(playerId);
        return {
          ...prev,
          showAdModal: null,
          isRecovering: true,
        };
      }

      return {
        ...prev,
        showAdModal: null,
      };
    });
  }

  // MARK: - shoot
  public shoot(
    playerId: string,
    location: LocationData,
    heading: number
  ): void {
    this.setState((prev) => {
      console.log('Shoot function');

      if (!prev.isAlive || !playerId) {
        console.log('❌ Shoot blocked - not alive or no player ID');
        return prev;
      }

      if (prev.isReloading) {
        console.log('⏳ Blocked - currently reloading');
        return prev;
      }

      const newAmmo = Math.max(0, prev.currentAmmo - 1);
      if (newAmmo === 0) {
        console.log('🚫 No ammo left, showing ad modal');
        return {
          ...prev,
          currentAmmo: newAmmo,
          showAdModal: 'ammo',
        };
      }

      if (this.isShooting) return { ...prev };
      this.isShooting = true;

      const shootData: ShootData = {
        playerId: playerId,
        location,
        heading,
        damage: 1,
        distance: 0,
      };

      // Send shoot message
      this.wsInstance.send({
        type: MessageType.SHOOT,
        playerId: playerId,
        data: shootData,
      });

      setTimeout(() => {
        this.isShooting = false;
      }, 500);

      return {
        ...prev,
        currentAmmo: newAmmo,
      };
    });
  }

  // MARK: - handleHit
  public handleHit(damage: number): void {
    this.setState((prev) => {
      if (!prev.isAlive || prev.isRecovering) return;

      const newLives = Math.max(
        0,
        prev.currentLives - Math.max(Math.round(damage), 1)
      );

      // Dispatch the hit event
      document.dispatchEvent(new CustomEvent('playerHit'));

      if (newLives === 0) {
        console.log('❤️‍🩹 No lives left, showing ad modal');
        return {
          ...prev,
          currentLives: newLives,
          showAdModal: 'lives',
        };
      }

      return {
        ...prev,
        currentLives: newLives,
      };
    });
  }

  // MARK: - resetDroneTimer
  public resetDroneTimer(): void {
    this.setState((prev) => {
      if (prev.droneTimer) {
        clearInterval(prev.droneTimer);
      }
      const timer = setInterval(() => {
        // Implement drone timeout logic if needed
      }, 30000);
      return { ...prev, droneTimer: timer };
    });
  }

  // MARK: - updateGameScore
  public updateGameScore(action: GameScoreAction): void {
    this.setState((prev) => {
      switch (action.type) {
        case 'DRONE_HIT':
          const updatedDrones = prev.drones.filter(
            (drone) => drone.droneId !== action.droneId
          );
          return {
            ...prev,
            drones: updatedDrones,
            gameScore: {
              ...prev.gameScore,
              hits: prev.gameScore.hits + 1,
            },
          };

        case 'HIT':
          return {
            ...prev,
            gameScore: {
              ...prev.gameScore,
              hits: prev.gameScore.hits + 1,
            },
          };

        case 'KILL':
          return {
            ...prev,
            gameScore: {
              ...prev.gameScore,
              kills: prev.gameScore.kills + 1,
            },
          };

        default:
          return prev;
      }
    });
  }
}

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
          return {
            ...prev,
            currentLives: prev.maxLives,
            isAlive: true,
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
        setTimeout(() => {
          this.setState((prev) => ({
            ...prev,
            currentLives: prev.maxLives,
            isAlive: true,
          }));
        }, RESPAWN_TIME);
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

      return {
        ...prev,
        currentAmmo: newAmmo,
      };
    });
  }

  // MARK: - handleHit
  public handleHit(damage: number): void {
    this.setState((prev) => {
      const newLives = Math.max(0, prev.currentLives - damage);

      // Dispatch the hit event
      document.dispatchEvent(new CustomEvent('playerHit'));

      if (newLives === 0) {
        return {
          ...prev,
          currentLives: newLives,
          isAlive: false,
          showAdModal: 'lives',
        };
      }

      if (newLives === 0 && !prev.showAdModal) {
        setTimeout(() => {
          this.setState((prev) => ({
            ...prev,
            currentLives: prev.maxLives,
            isAlive: true,
          }));
        }, RESPAWN_TIME);
      }

      return {
        ...prev,
        currentLives: newLives,
        isAlive: newLives > 0,
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

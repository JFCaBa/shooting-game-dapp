// src/services/GameStateService.ts

import { GameState } from '../types/gameContext';
import {
  GameMessage,
  MessageType,
  LocationData,
  ShootData,
} from '../types/game';
import { RELOAD_TIME } from '../types/gameContext';
import { hardcodedAdService } from './HardcodedAdService';

// MARK: - Type Definitions

type SendMessageFn = (message: GameMessage) => void;

export class GameStateService {
  // MARK: - Properties

  private isShooting: boolean = false;
  private sendMessage: SendMessageFn;
  private setState: (
    state: GameState | ((prevState: GameState) => GameState)
  ) => void;

  // MARK: - Constructor

  constructor(
    sendMessage: SendMessageFn,
    setState: (state: GameState | ((prevState: GameState) => GameState)) => void
  ) {
    console.log('[GameStateService] Initializing');
    this.sendMessage = sendMessage;
    this.setState = setState;
  }

  // MARK: - sendReloadRequest

  public sendReloadRequest(playerId: string): void {
    const reloadMessage: GameMessage = {
      type: MessageType.RELOAD,
      playerId: playerId,
    };
    this.sendMessage(reloadMessage);
  }

  // MARK: - sendRecoverRequest

  public sendRecoverRequest(playerId: string): void {
    const recoverMessage: GameMessage = {
      type: MessageType.RECOVER,
      playerId: playerId,
    };
    this.sendMessage(recoverMessage);
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
      return { ...prev, isRecovering: true };
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
          this.sendReloadRequest(playerId);
          return {
            ...prev,
            showAdModal: null,
            isReloading: false,
          };

        case 'lives':
          this.sendRecoverRequest(playerId);
          return {
            ...prev,
            showAdModal: null,
            isRecovering: false,
          };
        default:
          return {
            ...prev,
            showAdModal: null,
            isRecovering: false,
            isReloading: false,
          };
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
        isRecovering: false,
        isReloading: false,
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

      if (prev.isRecovering || !playerId) {
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
      this.sendMessage({
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

  // MARK: - sendKillMessage

  private sendKillMessage(targetPlayerId: string, playerId: string): void {
    const killMessage: GameMessage = {
      type: MessageType.KILL,
      playerId: targetPlayerId,
      senderId: playerId,
      data: {
        hitPlayerId: targetPlayerId,
      },
    };
    this.sendMessage(killMessage);
  }

  // MARK: - handleHit

  public handleHit(damage: number, shooterPlayerId?: string): void {
    this.setState((prev) => {
      if (prev.isRecovering) return prev;

      const newLives = Math.max(
        0,
        prev.currentLives - Math.max(Math.round(damage), 1)
      );

      // Dispatch the hit event
      document.dispatchEvent(new CustomEvent('playerHit'));

      if (newLives === 0 && shooterPlayerId && prev.playerId) {
        // Send KILL message when lives reach 0
        this.sendKillMessage(prev.playerId, shooterPlayerId);

        console.log('❤️‍🩹 No lives left, showing ad modal');
        return {
          ...prev,
          currentLives: newLives,
          showAdModal: 'lives',
          isAlive: false,
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
        case 'RESET_DRONES':
          return {
            ...prev,
            droneCount: 0,
          };

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

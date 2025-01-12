import { GameState } from '../types/gameContext';
import {
  GameMessage,
  MessageType,
  LocationData,
  ShootData,
} from '../types/game';
import { RELOAD_TIME } from '../types/gameContext';

type SendMessageFn = (message: GameMessage) => void;
type SetStateFn = (
  state: GameState | ((prevState: GameState) => GameState)
) => void;

export class GameStateService {
  private readonly sendMessage: SendMessageFn;
  private readonly setState: SetStateFn;
  private isShooting: boolean = false;

  constructor(sendMessage: SendMessageFn, setState: SetStateFn) {
    console.log('[GameStateService] Initializing');
    this.sendMessage = sendMessage;
    this.setState = setState;
  }

  public sendReloadRequest(playerId: string): void {
    console.log('[GameStateService] Sending reload request');
    this.sendMessage({
      type: MessageType.RELOAD,
      playerId: playerId,
    });
  }

  public sendRecoverRequest(playerId: string): void {
    console.log('[GameStateService] Sending recover request');
    this.sendMessage({
      type: MessageType.RECOVER,
      playerId: playerId,
    });
  }

  public performReload(playerId: string): void {
    console.log('[GameStateService] Starting reload process');
    this.setState((prev) => {
      if (prev.isReloading) {
        console.log('[GameStateService] Already reloading, skipping');
        return prev;
      }
      return { ...prev, isReloading: true };
    });

    setTimeout(() => {
      this.sendReloadRequest(playerId);
    }, RELOAD_TIME);
  }

  public performRecover(playerId: string): void {
    console.log('[GameStateService] Starting recover process');
    this.setState((prev) => {
      if (prev.isRecovering) {
        console.log('[GameStateService] Already recovering, skipping');
        return prev;
      }
      return { ...prev, isRecovering: true };
    });

    setTimeout(() => {
      this.sendRecoverRequest(playerId);
    }, RELOAD_TIME);
  }

  public handleAdReward(playerId: string): void {
    console.log('[GameStateService] Processing ad reward');
    this.setState((prev) => {
      switch (prev.showAdModal) {
        case 'ammo':
          this.performReload(playerId);
          return { ...prev, showAdModal: null };
        case 'lives':
          this.performRecover(playerId);
          return { ...prev, showAdModal: null };
        default:
          return prev;
      }
    });
  }

  public closeAdModal(playerId: string): void {
    console.log('[GameStateService] Closing ad modal');
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

  public shoot(
    playerId: string,
    location: LocationData,
    heading: number
  ): void {
    this.setState((prev) => {
      console.log('[GameStateService] Processing shoot action');

      if (prev.isRecovering || !playerId) {
        console.log(
          '[GameStateService] Shoot blocked - not alive or no player ID'
        );
        return prev;
      }

      if (prev.isReloading) {
        console.log('[GameStateService] Blocked - currently reloading');
        return prev;
      }

      const newAmmo = Math.max(0, prev.currentAmmo - 1);
      if (newAmmo === 0) {
        console.log('[GameStateService] No ammo left, showing ad modal');
        return {
          ...prev,
          currentAmmo: newAmmo,
          showAdModal: 'ammo',
        };
      }

      if (this.isShooting) {
        console.log('[GameStateService] Already shooting, skipping');
        return prev;
      }

      this.isShooting = true;

      const shootData: ShootData = {
        playerId: playerId,
        location,
        heading,
        damage: 1,
        distance: 0,
      };

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

  private sendKillMessage(targetPlayerId: string, playerId: string): void {
    console.log('[GameStateService] Sending kill message');
    this.sendMessage({
      type: MessageType.KILL,
      playerId: targetPlayerId,
      senderId: playerId,
      data: {
        hitPlayerId: targetPlayerId,
      },
    });
  }

  public handleHit(damage: number, shooterPlayerId?: string): void {
    this.setState((prev) => {
      if (prev.isRecovering) {
        console.log('[GameStateService] Hit blocked - currently recovering');
        return prev;
      }

      const newLives = Math.max(
        0,
        prev.currentLives - Math.max(Math.round(damage), 1)
      );

      document.dispatchEvent(new CustomEvent('playerHit'));

      if (newLives === 0 && shooterPlayerId && prev.playerId) {
        this.sendKillMessage(prev.playerId, shooterPlayerId);
        console.log('[GameStateService] Player killed, showing ad modal');
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

  public updateGameScore(action: GameScoreAction): void {
    console.log('[GameStateService] Updating game score:', action.type);
    this.setState((prev) => {
      switch (action.type) {
        case 'DRONE_HIT': {
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
        }

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

import {
  GameMessage,
  MessageType,
  ShootData,
  DroneData,
  Player,
  GeoObject,
  LocationData,
} from '../types/game';
import { HitValidationService } from './HitValidationService';
import { LocationStateManager } from './LocationStateManager';
import { GameState } from '../types/gameContext';
import { PlayerStats } from '../types/player';
import bulletService from './BulletService';

// MARK: - Type Definitions
type SendMessageFn = (message: GameMessage) => void;

// MARK: - GameMessageService Class
export class GameMessageService {
  // MARK: - Properties
  private hitValidationService: HitValidationService;
  private locationManager: LocationStateManager;
  private sendMessage: SendMessageFn;
  private getLocation: () => LocationData | null;
  private handleHit: (damage: number, shooterId?: string) => void;
  private setGeoObjects: React.Dispatch<React.SetStateAction<GeoObject[]>>;
  private setState: (
    state: GameState | ((prevState: GameState) => GameState)
  ) => void;
  private lastKnownLocation: LocationData | null = null;
  private state: GameState | null = null;
  private hasJoined: boolean = false;

  // MARK: - Constructor
  constructor(
    sendMessage: SendMessageFn,
    setState: (
      state: GameState | ((prevState: GameState) => GameState)
    ) => void,
    setGeoObjects: React.Dispatch<React.SetStateAction<GeoObject[]>>,
    handleHit: (damage: number, shooterId?: string) => void,
    getLocation: () => LocationData | null,
    locationManager: LocationStateManager,
    state: GameState
  ) {
    console.log('[GameMessageService] Initializing');
    this.sendMessage = sendMessage;
    this.setState = setState;
    this.hitValidationService = new HitValidationService();
    this.handleHit = handleHit;
    this.getLocation = () => {
      const currentLocation = getLocation();
      if (currentLocation) {
        this.lastKnownLocation = currentLocation;
      }
      return this.lastKnownLocation;
    };
    this.setGeoObjects = setGeoObjects;
    this.locationManager = locationManager;
    this.state = state;
  }

  // MARK: - sendJoinMessage
  public sendJoinMessage(playerId: string, location: LocationData): void {
    const pushToken = localStorage.getItem('pushToken');
    const joinMessage: GameMessage = {
      type: MessageType.JOIN,
      playerId: playerId,
      data: {
        location,
        playerId,
        kind: 'player',
        heading: 0,
      },
      pushToken,
    };

    try {
      console.log('Sending join message:', joinMessage);
      this.sendMessage(joinMessage);
    } catch (error) {
      console.error('Failed to send join message:', error);
    }
  }

  // MARK: - handleShoot

  private async handleShoot(
    message: GameMessage,
    shootData: ShootData,
    currentPlayerId: string
  ): Promise<void> {
    const currentLocation = this.locationManager.getCurrentLocation();

    if (!shootData || !shootData.location || !currentLocation) {
      console.log('Missing required data for shot validation');
      return;
    }

    // Now just pass the target type, let HitValidationService handle camera feed internally
    const hitValidation = await this.hitValidationService.validateHit(
      shootData.location,
      shootData.heading || 0,
      currentLocation,
      'player' // specify target type
    );

    const type = hitValidation.isValid
      ? MessageType.HIT_CONFIRMED
      : MessageType.SHOOT_CONFIRMED;

    const shootMessage: GameMessage = {
      type,
      playerId: currentPlayerId,
      senderId: message.playerId,
      data: {
        hitPlayerId: message.playerId,
        damage: hitValidation.damage,
        distance: hitValidation.distance,
        deviation: hitValidation.deviation,
        heading: shootData.heading,
        location: shootData.location,
        kind: 'shoot',
      },
    };

    this.sendMessage(shootMessage);
    if (hitValidation.isValid) {
      this.handleHit(hitValidation.damage, message.playerId);
    }
  }

  // MARK: - showReward

  private showReward(reward: number): void {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${reward} SHOT`;
    messageElement.style.position = 'absolute';
    messageElement.style.top = 'calc(33% - 60px)';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.color = 'red';
    messageElement.style.fontSize = '32px';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.opacity = '1';
    messageElement.style.transition = 'opacity 1s ease-out';

    document.body.appendChild(messageElement);

    setTimeout(() => {
      messageElement.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(messageElement);
      }, 1000);
    }, 1000);
  }

  // MARK: - handleGeoObjectUpdate

  private handleGeoObjectUpdate(message: GameMessage): void {
    if (message.data) {
      const newGeoObject = message.data as GeoObject;
      this.setGeoObjects((prevObjects) => [...prevObjects, newGeoObject]);
      this.setState((prev) => ({
        ...prev,
        geoObjects: [...prev.geoObjects, newGeoObject],
      }));
    }
  }

  // MARK: - Reset State
  public reset(): void {
    console.log('[GameMessageService] Resetting service state');
    this.hasJoined = false;
  }

  // MARK: - handleGameMessage
  public async handleGameMessage(
    message: GameMessage,
    currentPlayerId: string
  ): Promise<void> {
    // MARK: STATS
    switch (message.type) {
      case MessageType.STATS:
        if (message.data && message.playerId === currentPlayerId) {
          this.hasJoined = true;
          console.log('[GameMessageService] Updating stats: ', message.data);
          const stats = message.data as PlayerStats;

          // Update bullet store with available bullets from server
          if (message.data.availableBullets) {
            bulletService.setBullets(message.data.availableBullets);
          }

          this.setState((prev) => ({
            ...prev,
            currentAmmo: stats.currentAmmo ?? prev.currentAmmo,
            currentLives: stats.currentLives ?? prev.currentLives,
            gameScore: {
              hits: stats.hits ?? prev.gameScore.hits,
              kills: stats.kills ?? prev.gameScore.kills,
            },
            isReloading: false,
            isRecovering: false,
          }));
        }
        break;

      // MARK: SOOT

      case MessageType.SHOOT:
        if (message.data && message.playerId !== currentPlayerId) {
          await this.handleShoot(
            message,
            message.data as ShootData,
            currentPlayerId
          );
          this.setState((prev) => ({
            ...prev,
            players: prev.players.map((player) =>
              player.playerId === message.playerId
                ? {
                    ...player,
                    location: message.data.location!,
                    heading: message.data.heading,
                  }
                : player
            ),
          }));
        }
        break;

      // MARK: - HIT

      case MessageType.HIT:
        if (
          message.data &&
          message.data.shoot?.hitPlayerId === currentPlayerId
        ) {
          this.handleHit(message.data.shoot.damage, message.playerId);
        }
        break;

      // MARK: DRONE_SHOOT_CONFIRMED
      case MessageType.DRONE_SHOOT_CONFIRMED:
        this.showReward((message.data && message.data.reward) || 2);
        break;

      // MARK: - HIT_CONFIRMED

      case MessageType.HIT_CONFIRMED:
        if (message.data && message.senderId === currentPlayerId) {
          this.setState((prev) => ({
            ...prev,
            gameScore: {
              ...prev.gameScore,
              hits: prev.gameScore.hits + message.data.damage,
            },
          }));
        }
        break;

      // MARK: KILL

      case MessageType.KILL:
        if (message.data && message.senderId === currentPlayerId) {
          this.setState((prev) => ({
            ...prev,
            gameScore: {
              ...prev.gameScore,
              kills: prev.gameScore.kills + 1,
            },
          }));
        }
        break;

      // MARK: LEAVE
      case MessageType.LEAVE:
        this.setState((prev) => ({
          ...prev,
          players: prev.players.filter((p) => p.playerId !== message.playerId),
        }));
        break;

      // MARK: - ANNOUNCED
      case MessageType.ANNOUNCED:
        if (message.data && message.playerId !== currentPlayerId) {
          const newPlayer = message.data as Player;
          this.setState((prev) => ({
            ...prev,
            players: [
              ...prev.players.filter((p) => p.playerId !== message.playerId),
              newPlayer,
            ],
          }));
        }
        break;

      // MARK: NEW_DRONE

      case MessageType.NEW_DRONE:
        if (message.data && message.playerId === currentPlayerId) {
          this.setState((prev) => {
            const newDrone = message.data as DroneData;
            const existingDrones = prev.drones.filter(
              (p) => p.droneId !== newDrone.droneId
            );
            const updatedDrones = [...existingDrones, newDrone];
            return {
              ...prev,
              drones: updatedDrones.slice(-5),
            };
          });
        }
        break;

      // MARK: NEW_GEO_OBJECT

      case MessageType.NEW_GEO_OBJECT:
        this.handleGeoObjectUpdate(message);
        break;

      // MARK: GEO_OBJECT_HIT

      case MessageType.GEO_OBJECT_HIT:
        if (message.data && message.data.geoObject) {
          this.setGeoObjects((prev) =>
            prev.filter((obj) => obj.id !== message.data.geoObject.id)
          );
        }
        break;

      // MARK: GEO_OBJECT_SHOOT_CONFIRMED

      case MessageType.GEO_OBJECT_SHOOT_CONFIRMED:
        if (message.data && message.data.geoObject) {
          document.dispatchEvent(
            new CustomEvent('geoObjectShootConfirmed', {
              detail: message.data.geoObject,
            })
          );
        }
        break;
    }
  }
}

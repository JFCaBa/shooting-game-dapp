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

type SendMessageFn = (message: GameMessage) => void;

export class GameMessageService {
  private readonly hitValidationService: HitValidationService;
  private readonly sendMessage: SendMessageFn;
  private readonly setState: (
    state: GameState | ((prevState: GameState) => GameState)
  ) => void;
  private readonly setGeoObjects: React.Dispatch<
    React.SetStateAction<GeoObject[]>
  >;
  private readonly handleHit: (damage: number, shooterId?: string) => void;
  private readonly getLocation: () => LocationData | null;
  private readonly locationManager: LocationStateManager;
  private readonly state: GameState;

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
    this.getLocation = getLocation;
    this.setGeoObjects = setGeoObjects;
    this.locationManager = locationManager;
    this.state = state;
  }

  // MARK: - sendJoinMessage

  public sendJoinMessage(playerId: string): void {
    const location = this.getLocation();
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
      console.log('[GameMessageService] Sending join message:', joinMessage);
      this.sendMessage(joinMessage);
    } catch (error) {
      console.error('[GameMessageService] Failed to send join message:', error);
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
      console.log(
        '[GameMessageService] Missing required data for shot validation'
      );
      return;
    }

    const hitValidation = this.hitValidationService.validateHit(
      shootData.location,
      shootData.heading || 0,
      currentLocation
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

  // MARK: - geoObject update
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

  // MARK: - HANDLE MESSAGE

  public handleGameMessage(
    message: GameMessage,
    currentPlayerId: string
  ): void {
    switch (message.type) {
      // MARK: - stats
      case MessageType.STATS:
        if (message.data && message.playerId === currentPlayerId) {
          const stats = message.data as PlayerStats;
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
      // MARK: - shoot
      case MessageType.SHOOT:
        if (message.data && message.playerId !== currentPlayerId) {
          void this.handleShoot(
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
                    location: message.data!.location!,
                    heading: message.data!.heading,
                  }
                : player
            ),
          }));
        }
        break;
      // MARK: - hit
      case MessageType.HIT:
        if (
          message.data &&
          message.data.shoot?.hitPlayerId === currentPlayerId
        ) {
          this.handleHit(message.data.shoot.damage, message.playerId);
        }
        break;
      // MARK: - shoot confirmed
      case MessageType.DRONE_SHOOT_CONFIRMED:
        this.showReward((message.data && message.data.reward) || 2);
        break;
      // MARK - hit confirmed
      case MessageType.HIT_CONFIRMED:
        if (message.data && message.senderId === currentPlayerId) {
          this.setState((prev) => ({
            ...prev,
            gameScore: {
              ...prev.gameScore,
              hits: prev.gameScore.hits + message.data!.damage,
            },
          }));
        }
        break;
      // MARK: - kill
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
      // MARK: - leave
      case MessageType.LEAVE:
        this.setState((prev) => ({
          ...prev,
          players: prev.players.filter((p) => p.playerId !== message.playerId),
        }));
        break;
      // MARK: - announced
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
      // MARK: - new drone
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
      // MARK: - new geoObject
      case MessageType.NEW_GEO_OBJECT:
        this.handleGeoObjectUpdate(message);
        break;
      // MARK: - geoObject hit
      case MessageType.GEO_OBJECT_HIT:
        if (message.data && message.data.geoObject) {
          this.setGeoObjects((prev) =>
            prev.filter((obj) => obj.id !== message.data!.geoObject!.id)
          );
        }
        break;
      // MARK: geoObject shoot confirmed
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

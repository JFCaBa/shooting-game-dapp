import {
  GameMessage,
  MessageType,
  ShootData,
  DroneData,
  Player,
  GeoObject,
} from '../types/game';
import { HitValidationService } from './HitValidationService';
import { WebSocketService } from './WebSocketService';
import { GameState } from '../types/gameContext';
import { PlayerStats } from '../types/player';
import { LocationData } from '../types/game';

export class GameMessageService {
  private wsInstance: WebSocketService;
  private hitValidationService: HitValidationService;
  private getLocation: () => LocationData | null;
  private handleHit: (damage: number) => void;
  private setGeoObjects: React.Dispatch<React.SetStateAction<GeoObject[]>>;
  private setState: (
    state: GameState | ((prevState: GameState) => GameState)
  ) => void;

  constructor(
    wsInstance: WebSocketService,
    setState: (
      state: GameState | ((prevState: GameState) => GameState)
    ) => void,
    setGeoObjects: React.Dispatch<React.SetStateAction<GeoObject[]>>,
    handleHit: (damage: number) => void,
    getLocation: () => LocationData | null
  ) {
    this.wsInstance = wsInstance;
    this.setState = setState;
    this.hitValidationService = HitValidationService.getInstance();
    this.handleHit = handleHit;
    this.getLocation = getLocation;
    this.setGeoObjects = setGeoObjects;
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

  // MARK: - handleShoot
  private async handleShoot(
    message: GameMessage,
    shootData: ShootData,
    currentPlayerId: string
  ): Promise<void> {
    const currentLocation = this.getLocation();
    if (!shootData || !shootData.location || !currentLocation) {
      console.log('Missing required data for shot validation:', {
        hasShootData: !!shootData,
        hasShootLocation: !!shootData?.location,
        hasCurrentLocation: !!currentLocation,
      });
      return;
    }

    const hitValidation = await this.hitValidationService.validateHit(
      shootData.location,
      shootData.heading,
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

    this.wsInstance.send(shootMessage);
    this.handleHit(hitValidation.damage);
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

  // MARK: - handleGameMessage
  public async handleGameMessage(
    message: GameMessage,
    currentPlayerId: string
  ): Promise<void> {
    if (message.type === MessageType.WEBSOCKET_CONNECTED) {
      try {
        const pushToken = localStorage.getItem('pushToken');

        const joinMessage: GameMessage = {
          type: MessageType.JOIN,
          playerId: currentPlayerId,
          data: {
            playerId: currentPlayerId,
            kind: 'player',
            heading: 0,
          },
          pushToken: pushToken,
        };

        this.wsInstance.send(joinMessage);
      } catch (error) {
        console.error('Failed to send join message:', error);
      }
      return;
    }

    switch (message.type) {
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
          }));
        }
        break;

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

      case MessageType.HIT:
        if (
          message.data &&
          message.data.shoot?.hitPlayerId === currentPlayerId
        ) {
          this.handleHit(message.data.shoot.damage);
        }
        break;

      case MessageType.DRONE_SHOOT_CONFIRMED:
        this.showReward((message.data && message.data.reward) || 2);
        break;

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

      case MessageType.LEAVE:
        this.setState((prev) => ({
          ...prev,
          players: prev.players.filter((p) => p.playerId !== message.playerId),
        }));
        break;

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

      case MessageType.NEW_GEO_OBJECT:
        this.handleGeoObjectUpdate(message);
        break;

      case MessageType.GEO_OBJECT_HIT:
        if (message.data && message.data.geoObject) {
          this.setGeoObjects((prev) =>
            prev.filter((obj) => obj.id !== message.data.geoObject.id)
          );
        }
        break;

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

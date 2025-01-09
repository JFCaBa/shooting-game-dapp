import { useLocationContext } from '../context/LocationContext';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { WebSocketService } from '../services/WebSocketService';
import {
  GameMessage,
  Player,
  GameScore,
  MessageType,
  ShootData,
  LocationData,
  DroneData,
  GeoObject,
} from '../types/game';
import { generateTemporaryId } from '../utils/uuid';
import { HitValidationService } from '../services/HitValidationService';
import { PlayerStats } from '../types/player';

interface GameState {
  players: Player[];
  drones: DroneData[];
  gameScore: GameScore;
  playerId: string | null;
  isAlive: boolean;
  currentLives: number;
  maxLives: number;
  currentAmmo: number;
  maxAmmo: number;
  isReloading: boolean;
  droneTimer: NodeJS.Timer | null;
  geoObjects: GeoObject[];
  location: {
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
  };
  heading: number;
  pushToken: null;
  showAdModal: 'ammo' | 'lives' | null;
}

interface GameContextType extends GameState {
  geoObjects;
  setGeoObjects;
  shoot: (location: LocationData, heading: number) => void;
  reload: () => void;
  startGame: () => void;
  endGame: () => void;
  updateGameScore: (action: GameScoreAction) => void;
  handleAdReward: () => void;
  closeAdModal: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATE: GameState = {
  players: [],
  drones: [],
  gameScore: { hits: 0, kills: 0 },
  playerId: null,
  isAlive: true,
  currentLives: 0,
  maxLives: 10,
  currentAmmo: 0,
  maxAmmo: 30,
  isReloading: false,
  droneTimer: null,
  geoObjects: [],
  location: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
  heading: 0,
  pushToken: null,
  showAdModal: null,
};

const RELOAD_TIME = 3000;
const RESPAWN_TIME = 60000;

// MARK: - Game Provider

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [geoObjects, setGeoObjects] = useState<GeoObject[]>([]);
  const [, setGameStarted] = useState(false);
  const wsInstanceRef = useRef<WebSocketService | null>(null);
  const { location } = useLocationContext();
  const hitValidationService = HitValidationService.getInstance();

  // MARK: - updateGameScore

  const updateGameScore = useCallback((action: GameScoreAction) => {
    setState((prev) => {
      switch (action.type) {
        case 'DRONE_HIT':
          // Remove the hit drone from the drones array
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
  }, []);

  // MARK: - handleHit

  const handleHit = useCallback((damage: number) => {
    setState((prev) => {
      const newLives = Math.max(0, prev.currentLives - damage);
      // Show ad modal if player dies
      if (newLives === 0) {
        return {
          ...prev,
          currentLives: newLives,
          isAlive: false,
          showAdModal: 'lives',
        };
      }

      // Normal respawn timer if ad is declined
      if (newLives === 0 && !prev.showAdModal) {
        setTimeout(() => {
          setState((prev) => ({
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
  }, []);

  const resetDroneTimer = useCallback(() => {
    setState((prev) => {
      if (prev.droneTimer) {
        clearInterval(prev.droneTimer);
      }
      const timer = setInterval(() => {
        // Implement drone timeout logic
      }, 30000);
      return { ...prev, droneTimer: timer };
    });
  }, []);

  // MARK: - handleShoot

  const handleShoot = useCallback(
    async (
      message: GameMessage,
      shootData: ShootData,
      wsInstance: WebSocketService
    ) => {
      if (!shootData) {
        shootData = message.data as ShootData;
      }

      if (!shootData.location) {
        return;
      }

      console.log('Handling shot:', shootData);
      const hitValidation = await hitValidationService.validateHit(
        shootData.location!,
        shootData.heading,
        location
      );
      const type = hitValidation.isValid
        ? MessageType.HIT_CONFIRMED
        : MessageType.SHOOT_CONFIRMED;

      const shootMessage: GameMessage = {
        type,
        playerId: state.playerId!,
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

      wsInstance.send(shootMessage);
      handleHit(hitValidation.damage);
    },
    [state.playerId, handleHit, hitValidationService, location]
  );

  // MARK: - handleGeoObjectUpdate

  const handleGeoObjectUpdate = useCallback((message: GameMessage) => {
    if (message.data) {
      setGeoObjects((prev) => [...prev, message.data as GeoObject]);
      setState((prev) => ({
        ...prev,
        geoObjects: [...prev.geoObjects, message.data as GeoObject],
      }));
    }
  }, []);

  // MARK: - GameMessage

  const handleGameMessage = useCallback(
    async (message: GameMessage, wsInstance: WebSocketService) => {
      // console.log('Received message:', message);

      // When WebSocket connects, send join message
      if (message.type === MessageType.WEBSOCKET_CONNECTED) {
        try {
          const joinMessage: GameMessage = {
            type: MessageType.JOIN,
            playerId: state.playerId!,
            data: {
              playerId: state.playerId,
              kind: 'player',
              heading: 0,
            },
            pushToken: null,
          };

          wsInstance.send(joinMessage);
        } catch (error) {
          console.error('Failed to send join message:', error);
        }
        return;
      }

      switch (message.type) {
        case MessageType.STATS:
          console.log('Received STATS: ', message);
          if (message.data && message.playerId === state.playerId) {
            setState((prev) => ({
              ...prev,
              currentAmmo:
                (message.data as PlayerStats).currentAmmo ?? prev.currentAmmo,
              currentLives:
                (message.data as PlayerStats).currentLives ?? prev.currentLives,
              gameScore: {
                hits: (message.data as PlayerStats).hits ?? prev.gameScore.hits,
                kills:
                  (message.data as PlayerStats).kills ?? prev.gameScore.kills,
              },
              isReloading: false,
            }));
          }
          break;

        case MessageType.SHOOT:
          if (message.data && message.playerId !== state.playerId) {
            await handleShoot(message, message.data as ShootData, wsInstance);
            setState((prev) => ({
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
          if (message.data.shoot?.hitPlayerId === state.playerId) {
            handleHit(message.data.shoot.damage);
          }
          break;

        case MessageType.DRONE_SHOOT_CONFIRMED:
          // if (message.data.playerId == state.playerId) {
          const reward = message.data.reward || 2;
          showReward(reward);
          // }
          break;

        case MessageType.HIT_CONFIRMED:
          if (message.data && message.senderId === state.playerId) {
            const damage = message.data.damage;
            setState((prev) => ({
              ...prev,
              gameScore: {
                ...prev.gameScore,
                hits: prev.gameScore.hits + damage,
              },
            }));
          }
          break;

        case MessageType.KILL:
          if (message.data && message.senderId === state.playerId) {
            setState((prev) => ({
              ...prev,
              gameScore: {
                ...prev.gameScore,
                kills: prev.gameScore.kills + 1,
              },
            }));
          }
          break;

        case MessageType.LEAVE:
          setState((prev) => ({
            ...prev,
            players: prev.players.filter(
              (p) => p.playerId !== message.playerId
            ),
          }));
          break;

        case MessageType.ANNOUNCED:
          console.log('Announcement:', message.data);
          if (message.data && message.playerId !== state.playerId) {
            setState((prev) => ({
              ...prev,
              players: [
                ...prev.players.filter((p) => p.playerId !== message.playerId),
                message.data as Player,
              ],
            }));
          }
          break;

        case MessageType.NEW_DRONE:
          // console.log('New drone:', message.data);

          if (message.data && message.playerId === state.playerId) {
            resetDroneTimer();

            setState((prev) => {
              const existingDrones = prev.drones.filter(
                (p) => p.droneId !== (message.data as DroneData).droneId
              );

              // Ensure the list does not exceed 5 drones
              const updatedDrones = [
                ...existingDrones,
                message.data as DroneData,
              ];
              if (updatedDrones.length > 5) {
                updatedDrones.shift(); // Remove the oldest drone
              }

              return {
                ...prev,
                drones: updatedDrones,
              };
            });
          }
          break;

        case MessageType.NEW_GEO_OBJECT:
          handleGeoObjectUpdate(message);
          break;

        case MessageType.GEO_OBJECT_HIT:
          if (message.data.geoObject) {
            setGeoObjects((prev) =>
              prev.filter((obj) => obj.id !== message.data.geoObject.id)
            );
          }
          break;

        case MessageType.GEO_OBJECT_SHOOT_CONFIRMED:
          if (message.data.geoObject) {
            handleGeoObjectShootConfirmed(message.data.geoObject);
          }
          break;
      }
    },
    [state, location, handleShoot, resetDroneTimer, handleHit]
  );

  // MARK: - showReward

  interface ShowReward {
    (reward: number): void;
  }

  const showReward: ShowReward = (reward) => {
    // Show a message like '2 SHOT' for 1 sec and fade out, the position for the message 10px above the crosshairs
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
  };

  // MARK: - temporary id

  useEffect(() => {
    if (!state.playerId) {
      const playerId = generateTemporaryId();
      setState((prev) => ({ ...prev, playerId }));
    }
  }, [state.playerId]);

  // MARK: - socket connection

  useEffect(() => {
    if (!state.playerId || wsInstanceRef.current) {
      return; // Don't proceed if we don't have playerId or already have a connection
    }

    console.log('Setting up WebSocket connection for player:', state.playerId);
    const wsInstance = WebSocketService.getInstance();
    wsInstanceRef.current = wsInstance;

    const messageHandler = (message: GameMessage) =>
      handleGameMessage(message, wsInstance);
    wsInstance.addMessageListener(messageHandler);
    wsInstance.connect(); // Start connection
  }, [state.playerId, handleGameMessage]);

  // MARK: - Ammo/Lives check
  useEffect(() => {
    if (state.currentAmmo <= 0) {
      state.showAdModal = 'ammo';
    }
    if (state.currentLives <= 0) {
      state.showAdModal = 'lives';
    }
  }, [state.currentAmmo]);

  // MARK: - sendReloadRequest

  const sendReloadRequest = useCallback(() => {
    const playerId = localStorage.getItem('playerId');
    const wsInstance = WebSocketService.getInstance();

    // Send reload message to server only once
    const reloadMessage: GameMessage = {
      type: MessageType.RELOAD,
      playerId: playerId,
    };

    wsInstance.send(reloadMessage);
  }, []);

  // MARK: - performReload

  const performReload = useCallback(() => {
    if (state.isReloading) {
      console.log('⚠️ Already reloading');
      return;
    }

    console.log('⏳ Starting reload process');
    setState((prev) => ({ ...prev, isReloading: true }));

    // Complete reload after delay
    setTimeout(() => {
      console.log('📡 Sent reload message to server');
      sendReloadRequest();
    }, RELOAD_TIME);
  }, [sendReloadRequest]);

  // MARK: - handleAdReward

  const handleAdReward = useCallback(() => {
    setState((prev) => {
      switch (prev.showAdModal) {
        case 'ammo':
          performReload();
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
  }, [performReload]);

  // MARK: - closeAdModal

  const closeAdModal = useCallback(() => {
    setState((prev) => {
      if (prev.showAdModal === 'ammo') {
        performReload();
        return {
          ...prev,
          showAdModal: null,
          isReloading: true,
        };
      }

      if (prev.showAdModal === 'lives') {
        setTimeout(() => {
          setState((prev) => ({
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
  }, [performReload, RESPAWN_TIME]);

  // Rename reload to match its usage as a public method
  const reload = performReload;

  // MARK: - shoot

  const shoot = useCallback(
    (location: LocationData, heading: number) => {
      if (!state.isAlive || !state.playerId) {
        console.log('❌ Shoot blocked - not alive or no player ID');
        return;
      }

      // Check if already reloading
      if (state.isReloading) {
        console.log('⏳ Blocked - currently reloading');
        return;
      }

      // Update ammo count
      setState((prev) => {
        const newAmmo = Math.max(0, prev.currentAmmo - 1);
        // Show ad modal when ammo depleted
        if (newAmmo === 0) {
          console.log('🚫 No ammo left, showing ad modal');
          return {
            ...prev,
            currentAmmo: newAmmo,
            showAdModal: 'ammo',
          };
        }
        return {
          ...prev,
          currentAmmo: newAmmo,
        };
      });

      // Send shoot message
      const wsInstance = WebSocketService.getInstance();
      const shootData: ShootData = {
        playerId: state.playerId,
        location,
        heading,
        damage: 1,
        distance: 0,
      };

      wsInstance.send({
        type: MessageType.SHOOT,
        playerId: state.playerId,
        data: shootData,
      });
    },
    [state.isAlive, state.isReloading, state.currentAmmo, state.playerId]
  );

  // MARK: - handleGeoObjectShootConfirmed

  const handleGeoObjectShootConfirmed = (geoObject: GeoObject) => {
    document.dispatchEvent(
      new CustomEvent('geoObjectShootConfirmed', { detail: geoObject })
    );
  };

  const value: GameContextType = {
    ...state,
    geoObjects,
    setGeoObjects,
    shoot,
    reload,
    startGame: () => setGameStarted(true),
    endGame: () => setGameStarted(false),
    updateGameScore,
    handleAdReward,
    closeAdModal,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// MARK: - useGameContext

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

// Export only GameContext as GameProvider is already exported
export default GameContext;

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
import { locationService } from '../services/LocationService';
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
  currentLives: 10,
  maxLives: 10,
  currentAmmo: 30,
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

// MARK: -  Math utilities
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

const calculateDistance = (from: LocationData, to: LocationData): number => {
  const R = 6371e3;
  const φ1 = toRadians(from.latitude);
  const φ2 = toRadians(to.latitude);
  const Δφ = toRadians(to.latitude - from.latitude);
  const Δλ = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBearing = (from: LocationData, to: LocationData): number => {
  const φ1 = toRadians(from.latitude);
  const φ2 = toRadians(to.latitude);
  const Δλ = toRadians(to.longitude - from.longitude);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDegrees(θ) + 360) % 360;
};

const calculateDamage = (
  distance: number,
  maxRange: number,
  baseDamage: number
): number => {
  const damageFalloff = 1 - distance / maxRange;
  return Math.max(baseDamage * damageFalloff, baseDamage);
};

// MARK: - Game Provider

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [, setGameStarted] = useState(false);
  const wsInstanceRef = useRef<WebSocketService | null>(null);
  const { location } = useLocationContext();

  const validateHit = useCallback(
    async (shooterLocation: LocationData, shooterHeading: number) => {
      console.log('Validating hit:', shooterLocation, shooterHeading);

      try {
        const playerLocation = location
          ? location
          : await locationService.getCurrentLocation();
        console.log('Player location:', playerLocation);
        if (!playerLocation) {
          return { isValid: false, damage: 0, distance: 0, deviation: 0 };
        }

        const MAX_RANGE = 500;
        const MAX_ANGLE_ERROR = 30;
        const BASE_DAMAGE = 1;

        const distance = calculateDistance(shooterLocation, playerLocation);

        if (distance > MAX_RANGE) {
          return { isValid: false, damage: 0, distance, deviation: 0 };
        }

        const actualBearing = calculateBearing(shooterLocation, playerLocation);
        let angleDiff = Math.abs(shooterHeading - actualBearing);
        if (angleDiff > 180) {
          angleDiff = 360 - angleDiff;
        }

        const deviation = distance * Math.tan(toRadians(angleDiff));
        const isValid = angleDiff <= MAX_ANGLE_ERROR;
        const damage = isValid
          ? calculateDamage(distance, MAX_RANGE, BASE_DAMAGE)
          : 0;

        return { isValid, damage, distance, deviation };
      } catch (error) {
        console.error('Error fetching location:', error);
        return { isValid: false, damage: 0, distance: 0, deviation: 0 };
      }
    },
    [location]
  );

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

  // MARK: - Game logic
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

  const handleShot = useCallback(
    async (
      message: GameMessage,
      shootData: ShootData,
      wsInstance: WebSocketService
    ) => {
      if (!shootData) {
        shootData = message.data as ShootData;
      }

      console.log('Handling shot:', shootData);
      const hitValidation = await validateHit(
        shootData.location!,
        shootData.heading
      );
      const type = hitValidation.isValid
        ? MessageType.HIT_CONFIRMED
        : MessageType.SHOOT_CONFIRMED;

      const shootMessage: GameMessage = {
        type,
        playerId: state.playerId!,
        senderId: shootData.hitPlayerId,
        data: {
          hitPlayerId: shootData.hitPlayerId,
          damage: hitValidation.damage,
          distance: hitValidation.distance,
          deviation: hitValidation.deviation,
          heading: shootData.heading,
          location: shootData.location,
          kind: 'shoot',
        },
      };

      console.log('Sending shoot confirmation message:', shootMessage);
      wsInstance.send(shootMessage);
      handleHit(hitValidation.damage);
    },
    [state.playerId, validateHit, handleHit]
  );

  // MARK: - GameMessage

  const handleGameMessage = useCallback(
    async (message: GameMessage, wsInstance: WebSocketService) => {
      console.log('Received message:', message.type);

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

          console.log('Sending join message:', joinMessage);
          wsInstance.send(joinMessage);
        } catch (error) {
          console.error('Failed to send join message:', error);
        }
        return;
      }

      switch (message.type) {
        case MessageType.SHOOT:
          console.log('Shot received:', message.data);
          if (message.data && message.playerId !== state.playerId) {
            await handleShot(message, message.data as ShootData, wsInstance);
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
          console.log('New drone:', message.data);

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
          if (message.data.geoObject) {
            notifyNewGeoObject([message.data.geoObject]);
          }
          break;

        case MessageType.GEO_OBJECT_HIT:
          if (message.data.geoObject) {
            handleGeoObjectHit(message.data.geoObject);
          }
          break;

        case MessageType.GEO_OBJECT_SHOOT_CONFIRMED:
          if (message.data.geoObject) {
            handleGeoObjectShootConfirmed(message.data.geoObject);
          }
          break;
      }
    },
    [state, location, handleShot, resetDroneTimer, handleHit]
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

    // return () => {
    //   console.log('Cleaning up WebSocket connection');
    //   if (wsInstanceRef.current) {
    //     wsInstanceRef.current.removeMessageListener(messageHandler);
    //     wsInstanceRef.current.disconnect();
    //     wsInstanceRef.current = null;
    //   }
    // };
  }, [state.playerId, handleGameMessage]);

  // MARK: - handleAdReward

  const handleAdReward = useCallback(() => {
    switch (state.showAdModal) {
      case 'ammo':
        setState((prev) => ({
          ...prev,
          currentAmmo: prev.maxAmmo,
          isReloading: false,
          showAdModal: null,
        }));
        break;
      case 'lives':
        setState((prev) => ({
          ...prev,
          currentLives: prev.maxLives,
          isAlive: true,
          showAdModal: null,
        }));
        break;
    }
  }, [state.showAdModal]);

  // MARK: - closeAdModal

  const closeAdModal = useCallback(() => {
    console.log('Closing ad modal');
    setState((prev) => ({
      ...prev,
      showAdModal: null,
    }));

    console.log('⏳ Starting reload process');
    setState((prev) => ({ ...prev, isReloading: true }));

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        currentAmmo: prev.maxAmmo,
        isReloading: false,
      }));
    }, RELOAD_TIME);
  }, [state.isReloading, state.currentAmmo]);

  // MARK: reload

  const reload = useCallback(() => {
    console.log('🔄 Reload function called', {
      currentAmmo: state.currentAmmo,
      isReloading: state.isReloading,
      timestamp: new Date().toISOString(),
    });

    if (!state.isReloading) {
      // Only show ad modal or start reload when ammo is fully depleted
      if (state.currentAmmo <= 1) {
        console.log('📉 Zero ammo, showing ad modal');
        setState((prev) => ({ ...prev, showAdModal: 'ammo' }));
        return;
      }

      // Don't start reloading unless ammo is very low (let's say 1 or 0)
      if (state.currentAmmo > 1) {
        console.log(
          '🎯 Sufficient ammo, no need to reload:',
          state.currentAmmo
        );
        return;
      }

      console.log('⏳ Starting reload process');
      setState((prev) => ({ ...prev, isReloading: true }));

      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          currentAmmo: prev.maxAmmo,
          isReloading: false,
        }));
      }, RELOAD_TIME);
    }
  }, [state.isReloading, state.currentAmmo]);

  // MARK: - shoot

  const shoot = useCallback(
    (location: LocationData, heading: number) => {
      console.log(
        '🔫 Shoot function called with current ammo:',
        state.currentAmmo
      );

      if (!state.isAlive || !state.playerId) {
        console.log('❌ Shoot blocked - not alive or no player ID');
        return;
      }

      // Check current ammo before decreasing
      console.log('📊 Pre-shoot ammo check:', {
        currentAmmo: state.currentAmmo,
        isReloading: state.isReloading,
      });

      if (state.currentAmmo <= 0) {
        console.log('🚫 No ammo left, showing ad modal');
        setState((prev) => ({ ...prev, showAdModal: 'ammo' }));
        return;
      }

      if (state.isReloading) {
        console.log('⏳ Blocked - currently reloading');
        return;
      }

      // Update ammo count
      setState((prev) => {
        const newAmmo = prev.currentAmmo - 1;
        console.log('🔄 Decreasing ammo', {
          previous: prev.currentAmmo,
          new: newAmmo,
          timestamp: new Date().toISOString(),
        });

        // Only trigger reload when ammo is critically low
        if (newAmmo <= 1) {
          console.log('📉 Low ammo, triggering reload');
          setTimeout(() => reload(), 0);
        }

        return {
          ...prev,
          currentAmmo: newAmmo,
        };
      });

      const wsInstance = WebSocketService.getInstance();
      const shootData: ShootData = {
        playerId: state.playerId,
        location,
        heading,
        damage: 1,
        distance: 0,
      };

      const message: GameMessage = {
        type: MessageType.SHOOT,
        playerId: state.playerId,
        data: shootData,
      };

      if (location) {
        wsInstance.send(message);
        console.log('✅ Shot fired, message sent');
      }
    },
    [
      state.isAlive,
      state.isReloading,
      state.currentAmmo,
      state.playerId,
      reload,
    ]
  );

  const notifyNewGeoObject = (geoObjects: GeoObject[]) => {
    setState((prev) => ({
      ...prev,
      geoObjects: [...prev.geoObjects, ...geoObjects],
    }));
  };

  const handleGeoObjectHit = (geoObject: GeoObject) => {
    document.dispatchEvent(
      new CustomEvent('geoObjectHit', { detail: geoObject })
    );
  };

  const handleGeoObjectShootConfirmed = (geoObject: GeoObject) => {
    document.dispatchEvent(
      new CustomEvent('geoObjectShootConfirmed', { detail: geoObject })
    );
  };

  const value = {
    ...state,
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

// MARK: - generateTemporaryId
const generateTemporaryId = () => {
  const storedId = localStorage.getItem('playerId');
  if (storedId) {
    return storedId;
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) / 16;
      if (char === 'x') {
        return Math.floor(random * 16).toString(16);
      }
      return ((Math.floor(random * 16) & 0x3) | 0x8).toString(16);
    });
  };

  const newId = generateUUID();
  localStorage.setItem('playerId', newId);
  return newId;
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
export { GameContext };

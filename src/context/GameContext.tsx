// src/context/GameContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  GeoObject 
} from '../types/game';

interface GameState {
  players: Player[];
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
  location: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 }, // Add default location
  heading: 0,
  pushToken: null
}

interface GameContextType extends GameState {
  shoot: (location: LocationData, heading: number) => void;
  reload: () => void;
  startGame: () => void;
  endGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATE: GameState = {
  players: [],
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
  location: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 }, // Add default location
  heading: 0,
  pushToken: null
};

const RELOAD_TIME = 3000; // 3 seconds
const RESPAWN_TIME = 60000; // 60 seconds

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [gameStarted, setGameStarted] = useState(false);
  const webSocketService = WebSocketService.getInstance();

  useEffect(() => {
    if (!state.playerId) {
      const playerId = generateTemporaryId();
      setState(prev => ({ ...prev, playerId }));
    }
  }, [state.playerId]);

  useEffect(() => {
    if (state.playerId && !gameStarted) {
      startGame();
      setGameStarted(true);
    }
  }, [state.playerId, gameStarted]);

  // MARK: - Game message handling

  const handleGameMessage = (message: GameMessage) => {
    console.log('Handle game message:', message);
    switch (message.type) {
      case MessageType.SHOOT:
        if (message.data && message.playerId !== state.playerId) {
          console.log('Received shoot message:', message);
          handleShot(message, message.data.shoot);
          updatePlayerFromShootData(message.data.shoot);
        }
        break;

      case MessageType.SHOOT_CONFIRMED:
        if (message.data.shoot) {
          notifyShootConfirmed(message.data.shoot);
        }
        break;

      case MessageType.HIT_CONFIRMED:
        if (message.data.shoot && message.senderId === state.playerId) {
          setState(prev => ({
            ...prev,
            gameScore: {
              ...prev.gameScore,
              hits: prev.gameScore.hits + 1
            }
          }));
          notifyHitConfirmed(message.data.shoot.damage);
        }
        break;

      case MessageType.KILL:
        if (message.data.shoot && message.senderId === state.playerId) {
          setState(prev => ({
            ...prev,
            gameScore: {
              ...prev.gameScore,
              kills: prev.gameScore.kills + 1
            }
          }));
          notifyKill(message.data.shoot.hitPlayerId || '');
        }
        break;

      case MessageType.LEAVE:
        removePlayer(message.playerId);
        break;

      case MessageType.HIT:
        if (message.data.shoot?.hitPlayerId === state.playerId) {
          handleHit(message.data.shoot.damage);
        }
        break;

      case MessageType.ANNOUNCED:
        if (message.data.player && message.playerId !== state.playerId) {
          updatePlayerFromShootData(createShootDataFromPlayer(message.data.player));
        }
        break;

      case MessageType.NEW_DRONE:
        if (message.data.drone && message.playerId === state.playerId) {
          resetDroneTimer();
          notifyNewDrone(message.data.drone);
        }
        break;

      case MessageType.DRONE_SHOOT_CONFIRMED:
        if (message.data.drone && message.playerId === state.playerId) {
          if (state.droneTimer) {
            clearInterval(state.droneTimer);
          }
          notifyDroneShootConfirmed(message.data.drone);
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
  };

  // MARK: - Player management

  const updatePlayerFromShootData = (shootData: ShootData) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.playerId === shootData.playerId ? { ...p, location: shootData.location!, heading: shootData.heading } : p
      )
    }));
  };

  const createShootDataFromPlayer = (player: Player): ShootData => ({
    playerId: player.playerId,
    location: player.location,
    heading: player.heading,
    damage: 0,
    distance: 0,
    deviation: 0
  });

  const removePlayer = (playerId: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.playerId !== playerId)
    }));
  };

  // MARK: - Game logic

  const handleShot = async (message: GameMessage, shootData: ShootData) => {
    if (!shootData) {
      shootData = message.data as ShootData;
    }
    
    console.log('Handling shot:', shootData);

    // Validate the shot based on location and heading
    const hitValidation = await validateHit(shootData.location!, shootData.heading);
    const type = hitValidation.isValid ? MessageType.HIT : MessageType.SHOOT_CONFIRMED;

    const hitMessage: GameMessage = {
      type: type,
      playerId: state.playerId!,
      senderId: shootData.hitPlayerId,
      data: {
          hitPlayerId: shootData.hitPlayerId,
          damage: hitValidation.damage,
          distance: hitValidation.distance,
          deviation: hitValidation.deviation,
          heading: shootData.heading,
          kind: 'shoot',
      }
    };
    
    webSocketService.send(hitMessage);
    
    // Update player state based on hit
    await handleHit(hitValidation.damage);
  };

  const validateHit = async (shooterLocation: LocationData, shooterHeading: number) => {
    // Get current player location from state or location context
    const playerLocation = await locationService.getCurrentLocation();
    
    if (!playerLocation) {
      return { isValid: false, damage: 0, distance: 0, deviation: 0 };
    }

    const MAX_RANGE = 500; // meters
    const MAX_ANGLE_ERROR = 30; // degrees
    const BASE_DAMAGE = 1;

    // Calculate distance between shooter and target
    const distance = calculateDistance(shooterLocation, playerLocation);
    
    // Check if target is in range
    if (distance > MAX_RANGE) {
      return { isValid: false, damage: 0, distance, deviation: 0 };
    }

    // Calculate actual bearing to target
    const actualBearing = calculateBearing(shooterLocation, playerLocation);
    
    // Calculate angle difference
    let angleDiff = Math.abs(shooterHeading - actualBearing);
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff;
    }

    // Calculate deviation in meters
    const deviation = distance * Math.tan(toRadians(angleDiff));

    // Validate hit based on angle difference
    const isValid = angleDiff <= MAX_ANGLE_ERROR;

    // Calculate damage based on distance (closer = more damage)
    const damage = isValid ? calculateDamage(distance, MAX_RANGE, BASE_DAMAGE) : 0;

    return {
      isValid,
      damage,
      distance,
      deviation
    };
  };

  // MARK: - Math and utility functions

  const calculateDistance = (from: LocationData, to: LocationData): number => {
    console.log('Calculating distance:', from, to);

    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRadians(from.latitude);
    const φ2 = toRadians(to.latitude);
    const Δφ = toRadians(to.latitude - from.latitude);
    const Δλ = toRadians(to.longitude - from.longitude);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateBearing = (from: LocationData, to: LocationData): number => {
    const φ1 = toRadians(from.latitude);
    const φ2 = toRadians(to.latitude);
    const Δλ = toRadians(to.longitude - from.longitude);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
             Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    const θ = Math.atan2(y, x);
    return (toDegrees(θ) + 360) % 360;
  };

  const toRadians = (degrees: number): number => {
    return degrees * Math.PI / 180;
  };

  const toDegrees = (radians: number): number => {
    return radians * 180 / Math.PI;
  };

  const calculateDamage = (distance: number, maxRange: number, baseDamage: number): number => {
    const damageFalloff = 1 - (distance / maxRange);
    return Math.max(baseDamage * damageFalloff, baseDamage);
  };

  // MARK: - Event notifications

  const notifyShootConfirmed = (shootData: ShootData) => {
    document.dispatchEvent(new CustomEvent('shootConfirmed', { detail: shootData }));
  };

  const notifyHitConfirmed = (damage: number) => {
    document.dispatchEvent(new CustomEvent('hitConfirmed', { detail: { damage } }));
  };

  const notifyKill = (targetId: string) => {
    document.dispatchEvent(new CustomEvent('kill', { detail: { targetId } }));
  };

  const notifyNewDrone = (droneData: DroneData) => {
    document.dispatchEvent(new CustomEvent('newDrone', { detail: droneData }));
  };

  const notifyDroneShootConfirmed = (droneData: DroneData) => {
    document.dispatchEvent(new CustomEvent('droneShootConfirmed', { detail: droneData }));
  };

  const notifyNewGeoObject = (geoObjects: GeoObject[]) => {
    setState(prev => ({
      ...prev,
      geoObjects: [...prev.geoObjects, ...geoObjects]
    }));
  };

  // MARK: - GeoObject event handlers

  const handleGeoObjectHit = (geoObject: GeoObject) => {
    document.dispatchEvent(new CustomEvent('geoObjectHit', { detail: geoObject }));
  };

  const handleGeoObjectShootConfirmed = (geoObject: GeoObject) => {
    document.dispatchEvent(new CustomEvent('geoObjectShootConfirmed', { detail: geoObject }));
  };

  // MARK: - Drone timer management

  const resetDroneTimer = () => {
    if (state.droneTimer) {
      clearInterval(state.droneTimer);
    }
    const timer = setInterval(() => {
      // Implement drone timeout logic
    }, 30000); // 30 seconds timeout
    setState(prev => ({ ...prev, droneTimer: timer }));
  };

  // MARK: - Game actions

    const handleHit = (damage: number) => {
    setState(prev => {
      const newLives = prev.currentLives - damage;
      const isAlive = newLives > 0;

      if (!isAlive) {
        // Equivalent to NotificationCenter.default.post(name: .playerDied)
        document.dispatchEvent(new CustomEvent('playerDied'));
        respawnPlayer();
      }

      return {
        ...prev,
        currentLives: newLives,
        isAlive
      };
    });
  };

  const respawnPlayer = () => {
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentLives: prev.maxLives,
        currentAmmo: prev.maxAmmo,
        isAlive: true,
        isReloading: false
      }));
    }, RESPAWN_TIME);
  };

  const reload = () => {
    if (!state.isReloading) {
      setState(prev => ({ ...prev, isReloading: true }));
      
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentAmmo: prev.maxAmmo,
          isReloading: false
        }));
      }, RELOAD_TIME);
    }
  };
  
  const shoot = (location: LocationData, heading: number) => {
    if (!state.isAlive || state.isReloading || state.currentAmmo <= 0 || !state.playerId) {
      return;
    }

    // Update ammunition state first
    setState(prev => {
      const newAmmo = Math.max(0, prev.currentAmmo - 1);

      // Start reload if out of ammo
      if (newAmmo <= 0) {
        reload();
      }

      return {
        ...prev,
        currentAmmo: newAmmo
      };
    });

    // Send WebSocket message
    const shootData: ShootData = {
      damage: 1,
      distance: 0,
      deviation: 0,
      heading,
      location
    };

    const message: GameMessage = {
      type: MessageType.SHOOT,
      playerId: state.playerId,
      data: { shoot: shootData }
    };

    webSocketService.send(message);
  };

  const startGame = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      const joinMessage = {
        playerId: state.playerId,
        type: 'join',
        data: {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            altitude: location.altitude || 0,
            accuracy: location.accuracy,
          },
          playerId: state.playerId,
          kind: 'player',
          heading: 0, // Add default heading
        },
        pushToken: state.pushToken, // Ensure pushToken is set in state
    };

      webSocketService.connect(joinMessage);
      webSocketService.addMessageListener(handleGameMessage);
      setState(INITIAL_STATE);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const endGame = () => {
    webSocketService.disconnect();
    setState(INITIAL_STATE);
  };

  const value: GameContextType = {
    ...state,
    shoot,
    reload,
    startGame,
    endGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

const generateTemporaryId = () => {
  // Check if we already have a stored ID
  const storedId = localStorage.getItem('playerId');
  if (storedId) {
    return storedId;
  }

  // Generate a new UUID-like identifier
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) / 16;
      if (char === 'x') {
        return Math.floor(random * 16).toString(16);
      }
      return (Math.floor(random * 16) & 0x3 | 0x8).toString(16); // Ensures correct variant
    });
  };

  const newId = generateUUID();
  localStorage.setItem('playerId', newId);
  return newId;
};

export default GameContext;
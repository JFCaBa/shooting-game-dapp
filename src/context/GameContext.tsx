// src/context/GameContext.tsx
// No route - Context provider
// Manages global game state and WebSocket connections

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { GameMessage, Player, GameScore, MessageType, ShootData, LocationData } from '../types/game';

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
  isReloading: false
};

const RELOAD_TIME = 3000; // 3 seconds
const RESPAWN_TIME = 60000; // 60 seconds

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const webSocketService = WebSocketService.getInstance();

  useEffect(() => {
    if (!state.playerId) {
      setState(prev => ({ ...prev, playerId: generateTemporaryId() }));
    }
    return () => webSocketService.disconnect();
  }, []);

  const handleGameMessage = (message: GameMessage) => {
    if (message.playerId === state.playerId) return;

    switch (message.type) {
      case MessageType.HIT:
        if (message.data.shoot?.hitPlayerId === state.playerId) {
          handleHit(message.data.shoot.damage);
        }
        break;
      case MessageType.KILL:
        if (message.senderId === state.playerId) {
          setState(prev => ({
            ...prev,
            gameScore: {
              ...prev.gameScore,
              kills: prev.gameScore.kills + 1
            }
          }));
        }
        break;
      case MessageType.HIT_CONFIRMED:
        if (message.senderId === state.playerId) {
          setState(prev => ({
            ...prev,
            gameScore: {
              ...prev.gameScore,
              hits: prev.gameScore.hits + 1
            }
          }));
        }
        break;
      case MessageType.JOIN:
      case MessageType.LEAVE:
        updatePlayers(message);
        break;
    }
  };

  const handleHit = (damage: number) => {
    if (!state.isAlive) return;

    const newLives = state.currentLives - damage;
    
    setState(prev => ({
      ...prev,
      currentLives: newLives,
      isAlive: newLives > 0
    }));

    if (newLives <= 0) {
      respawnPlayer();
    }
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

  const updatePlayers = (message: GameMessage) => {
    if (message.type === MessageType.JOIN && message.data.player) {
      setState(prev => ({
        ...prev,
        players: [...prev.players, message.data.player!]
      }));
    } else if (message.type === MessageType.LEAVE) {
      setState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== message.playerId)
      }));
    }
  };

  const shoot = (location: LocationData, heading: number) => {
    if (!state.isAlive || state.isReloading || state.currentAmmo <= 0 || !state.playerId) return;

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

    const newAmmo = state.currentAmmo - 1;
    setState(prev => ({
      ...prev,
      currentAmmo: newAmmo,
      isReloading: newAmmo <= 0
    }));

    if (newAmmo <= 0) {
      reload();
    }
  };

  const reload = () => {
    setState(prev => ({ ...prev, isReloading: true }));

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentAmmo: prev.maxAmmo,
        isReloading: false
      }));
    }, RELOAD_TIME);
  };

  const startGame = () => {
    webSocketService.connect();
    webSocketService.addMessageListener(handleGameMessage);
    setState(INITIAL_STATE);
  };

  const endGame = () => {
    webSocketService.disconnect();
    setState(INITIAL_STATE);
  };

  const generateTemporaryId = () => {
    return 'player_' + Math.random().toString(36).substring(2, 9);
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

export default GameContext;
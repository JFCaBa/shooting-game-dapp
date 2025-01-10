import { useLocationContext } from '../context/LocationContext';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { GameMessage, GeoObject } from '../types/game';
import { generateTemporaryId } from '../utils/uuid';
import { GameMessageService } from '../services/GameMessageService';
import { GameStateService } from '../services/GameStateService';
import {
  GameContextType,
  GameState,
  INITIAL_STATE,
} from '../types/gameContext';

const GameContext = createContext<GameContextType | undefined>(undefined);

// MARK: - Game Provider

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [geoObjects, setGeoObjects] = useState<GeoObject[]>([]);
  const [, setGameStarted] = useState(false);
  const wsInstanceRef = useRef<WebSocketService | null>(null);
  const { location } = useLocationContext();
  const gameMessageServiceRef = useRef<GameMessageService | null>(null);
  const gameStateServiceRef = useRef<GameStateService | null>(null);

  // MARK: - Initialize WebSocket connection
  useEffect(() => {
    if (!state.playerId || wsInstanceRef.current) {
      return;
    }

    console.log('Setting up WebSocket connection for player:', state.playerId);
    const wsInstance = WebSocketService.getInstance();
    wsInstanceRef.current = wsInstance;

    gameStateServiceRef.current = new GameStateService(wsInstance, setState);
    gameMessageServiceRef.current = new GameMessageService(
      wsInstance,
      setState,
      setGeoObjects,
      (damage) => gameStateServiceRef.current?.handleHit(damage),
      () => location
    );

    const messageService = (message: GameMessage) =>
      gameMessageServiceRef.current?.handleGameMessage(
        message,
        state.playerId!
      );

    wsInstance.addMessageListener(messageService);
    wsInstance.connect();
  }, [state.playerId]);

  // MARK: - temporary id

  useEffect(() => {
    if (!state.playerId) {
      const playerId = generateTemporaryId();
      setState((prev) => ({ ...prev, playerId }));
    }
  }, [state.playerId]);

  // MARK: - Check ammo/lives state
  useEffect(() => {
    if (state.currentAmmo <= 0) {
      setState((prev) => ({ ...prev, showAdModal: 'ammo' }));
    }
    if (state.currentLives <= 0) {
      setState((prev) => ({ ...prev, showAdModal: 'lives' }));
    }
  }, [state.currentAmmo, state.currentLives]);

  // MARK: - handleGeoObjectShootConfirmed

  const handleGeoObjectShootConfirmed = (geoObject: GeoObject) => {
    document.dispatchEvent(
      new CustomEvent('geoObjectShootConfirmed', { detail: geoObject })
    );
  };

  const contextValue: GameContextType = {
    ...state,
    geoObjects,
    setGeoObjects,
    shoot: (location, heading) =>
      gameStateServiceRef.current?.shoot(state.playerId!, location, heading),
    reload: () => gameStateServiceRef.current?.performReload(state.playerId!),
    startGame: () => setGameStarted(true),
    endGame: () => setGameStarted(false),
    updateGameScore: (action) =>
      gameStateServiceRef.current?.updateGameScore(action),
    handleAdReward: () =>
      gameStateServiceRef.current?.handleAdReward(state.playerId!),
    closeAdModal: () =>
      gameStateServiceRef.current?.closeAdModal(state.playerId!),
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
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

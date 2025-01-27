// MARK: - Imports
import { useLocationContext } from './LocationContext';
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { GameMessage, GeoObject, LocationData } from '../types/game';
import { generateTemporaryId } from '../utils/uuid';
import { GameMessageService } from '../services/GameMessageService';
import { GameStateService } from '../services/GameStateService';
import { LocationStateManager } from '../services/LocationStateManager';
import {
  GameContextType,
  GameState,
  INITIAL_STATE,
} from '../types/gameContext';
import { useWebSocketService } from '../hooks/useWebSocketService';

// MARK: - Context Creation

const GameContext = createContext<GameContextType | undefined>(undefined);

// MARK: - GameProvider Component

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // MARK: - State Management

  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [geoObjects, setGeoObjects] = useState<GeoObject[]>([]);
  const { location } = useLocationContext();
  const locationManager = LocationStateManager.getInstance();

  // Initialize playerId if not exists
  useState(() => {
    if (!state.playerId) {
      const playerId = generateTemporaryId();
      setState((prev) => ({ ...prev, playerId }));
    }
  });

  // MARK: - WebSocket Integration

  const { isConnected, addMessageListener, send } = useWebSocketService(
    state.playerId
  );

  // MARK: - Service References

  const gameMessageServiceRef = useRef<GameMessageService | null>(null);
  const gameStateServiceRef = useRef<GameStateService | null>(null);

  // MARK: - Service and Listener Initialization

  useEffect(() => {
    if (!state.playerId) return;

    let isSubscribed = true;
    console.log('[GameContext] Initializing services and listener');

    // Create services only once with stable references
    const getLocation = () => location;

    if (!gameStateServiceRef.current) {
      console.log('[GameContext] Creating GameStateService');
      gameStateServiceRef.current = new GameStateService(send, setState);
    }

    if (!gameMessageServiceRef.current) {
      console.log('[GameContext] Creating GameMessageService');
      gameMessageServiceRef.current = new GameMessageService(
        send,
        setState,
        setGeoObjects,
        (damage, shooterId) =>
          gameStateServiceRef.current?.handleHit(damage, shooterId),
        getLocation,
        locationManager,
        state
      );
    }

    // Message handler with subscription check
    const handleMessage = (message: GameMessage) => {
      if (!isSubscribed) return;
      console.log('[GameContext] Processing message:', message.type);
      gameMessageServiceRef.current?.handleGameMessage(
        message,
        state.playerId!
      );
    };

    console.log('[GameContext] Setting up message listener');
    const cleanup = addMessageListener(handleMessage);

    return () => {
      console.log('[GameContext] Cleaning up listener subscription');
      isSubscribed = false;
      cleanup();
    };
  }, [state.playerId]);

  useEffect(() => {
    console.log('[GameContext] WebSocket connection status:', isConnected);
  }, [isConnected, addMessageListener]);

  // MARK: - Game Actions

  const shoot = useCallback(
    (location: LocationData, heading: number) =>
      gameStateServiceRef.current?.shoot(state.playerId!, location, heading),
    [state.playerId]
  );

  const reload = useCallback(
    () => gameStateServiceRef.current?.performReload(state.playerId!),
    [state.playerId]
  );

  const recover = useCallback(
    () => gameStateServiceRef.current?.performRecover(state.playerId!),
    [state.playerId]
  );

  const updateGameScore = useCallback(
    (action) => gameStateServiceRef.current?.updateGameScore(action),
    []
  );

  const handleAdReward = useCallback(
    () => gameStateServiceRef.current?.handleAdReward(state.playerId!),
    [state.playerId]
  );

  const closeAdModal = useCallback(
    () => gameStateServiceRef.current?.closeAdModal(state.playerId!),
    [state.playerId]
  );

  // MARK: - Context Value

  const contextValue: GameContextType = {
    ...state,
    geoObjects,
    setGeoObjects,
    shoot,
    reload,
    recover,
    startGame: () => setState((prev) => ({ ...prev, isGameStarted: true })),
    endGame: () => setState((prev) => ({ ...prev, isGameStarted: false })),
    updateGameScore,
    handleAdReward,
    closeAdModal,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

// MARK: - Hook Export

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

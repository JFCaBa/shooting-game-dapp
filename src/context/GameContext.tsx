import { useLocationContext } from './LocationContext';
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { GameMessage, GeoObject, MessageType } from '../types/game';
import { generateTemporaryId } from '../utils/uuid';
import { GameMessageService } from '../services/GameMessageService';
import { GameStateService } from '../services/GameStateService';
import { LocationStateManager } from '../services/LocationStateManager';
import {
  GameContextType,
  GameState,
  INITIAL_STATE,
} from '../types/gameContext';
import { usePersistentWebSocket } from '../hooks/usePersistentWebSocket';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<GameState>(() => {
    const playerId = generateTemporaryId();
    return { ...INITIAL_STATE, playerId };
  });

  const [geoObjects, setGeoObjects] = useState<GeoObject[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const { location } = useLocationContext();
  const locationManager = LocationStateManager.getInstance();

  const { isConnected, addMessageListener, send } = usePersistentWebSocket(
    state.playerId
  );

  const gameMessageServiceRef = useRef<GameMessageService | null>(null);
  const gameStateServiceRef = useRef<GameStateService | null>(null);

  // Initialize services
  useEffect(() => {
    if (!state.playerId) return;

    console.log('[GameContext] Initializing services');
    const getLocation = () => location;

    // Initialize GameStateService
    gameStateServiceRef.current = new GameStateService(send, setState);

    // Initialize GameMessageService
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

    return () => {
      console.log('[GameContext] Cleaning up services');
      gameMessageServiceRef.current = null;
      gameStateServiceRef.current = null;
    };
  }, [state.playerId]); // Only re-initialize when playerId changes

  // Handle WebSocket messages
  useEffect(() => {
    if (!state.playerId || !gameMessageServiceRef.current) return;

    console.log('[GameContext] Setting up message listener');
    const handleMessage = (message: GameMessage) => {
      if (message.type === MessageType.WEBSOCKET_CONNECTED && !hasJoined) {
        console.log('[GameContext] New connection, sending JOIN message');
        gameMessageServiceRef.current?.sendJoinMessage(state.playerId!);
        setHasJoined(true);
      } else {
        gameMessageServiceRef.current?.handleGameMessage(
          message,
          state.playerId!
        );
      }
    };

    const cleanup = addMessageListener(handleMessage);

    return () => {
      console.log('[GameContext] Removing message listener');
      cleanup();
    };
  }, [state.playerId, hasJoined, addMessageListener]);

  // Reset join state when connection is lost
  useEffect(() => {
    if (!isConnected) {
      console.log('[GameContext] Connection lost, resetting join state');
      setHasJoined(false);
    }
  }, [isConnected]);

  // Game actions
  const shoot = useCallback(
    (location, heading) => {
      if (gameStateServiceRef.current) {
        gameStateServiceRef.current.shoot(state.playerId!, location, heading);
      }
    },
    [state.playerId]
  );

  const reload = useCallback(() => {
    if (gameStateServiceRef.current) {
      gameStateServiceRef.current.performReload(state.playerId!);
    }
  }, [state.playerId]);

  const updateGameScore = useCallback((action) => {
    if (gameStateServiceRef.current) {
      gameStateServiceRef.current.updateGameScore(action);
    }
  }, []);

  const handleAdReward = useCallback(() => {
    if (gameStateServiceRef.current) {
      gameStateServiceRef.current.handleAdReward(state.playerId!);
    }
  }, [state.playerId]);

  const closeAdModal = useCallback(() => {
    if (gameStateServiceRef.current) {
      gameStateServiceRef.current.closeAdModal(state.playerId!);
    }
  }, [state.playerId]);

  const contextValue: GameContextType = {
    ...state,
    geoObjects,
    setGeoObjects,
    shoot,
    reload,
    startGame: useCallback(
      () => setState((prev) => ({ ...prev, isGameStarted: true })),
      []
    ),
    endGame: useCallback(
      () => setState((prev) => ({ ...prev, isGameStarted: false })),
      []
    ),
    updateGameScore,
    handleAdReward,
    closeAdModal,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

export default GameContext;

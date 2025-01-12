import { useState, useEffect, useCallback } from 'react';
import { webSocketPersistentService } from '../services/WebSocketPersistentService';
import { GameMessage } from '../types/game';

export const usePersistentWebSocket = (playerId: string | null) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!playerId) {
      console.log('[usePersistentWebSocket] No playerId provided');
      return;
    }

    // Initialize WebSocket service with playerId
    webSocketPersistentService.initialize(playerId);

    // Update connection status
    const updateConnectionStatus = () => {
      setIsConnected(webSocketPersistentService.getConnectionStatus());
    };

    // Check status periodically
    const statusInterval = setInterval(updateConnectionStatus, 1000);
    updateConnectionStatus();

    return () => {
      clearInterval(statusInterval);
    };
  }, [playerId]);

  const addMessageListener = useCallback(
    (callback: (message: GameMessage) => void) => {
      console.log('[usePersistentWebSocket] Adding message listener');
      return webSocketPersistentService.addMessageListener(callback);
    },
    []
  );

  const send = useCallback((message: GameMessage) => {
    webSocketPersistentService.send(message);
  }, []);

  return {
    isConnected,
    addMessageListener,
    send,
  };
};

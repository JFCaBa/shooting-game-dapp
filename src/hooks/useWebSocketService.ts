import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { GameMessage, MessageType } from '../types/game';
import { useLocationManager } from './useLocationManagerState';

export const useWebSocketService = (playerId: string | null) => {
  const wsRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const locationManager = useLocationManager();

  // Initialize WebSocket service and handle connection
  useEffect(() => {
    if (!playerId) {
      console.log(
        '[useWebSocket] No playerId provided, skipping initialization'
      );
      return;
    }

    console.log(
      '[useWebSocket] Initializing WebSocket service for player:',
      playerId
    );
    wsRef.current = WebSocketService.getInstance();

    // Send JOIN message when connection is established
    const handleConnectionStatus = () => {
      if (wsRef.current) {
        const status = wsRef.current.getConnectionStatus();

        // If we just got connected, send the JOIN message
        if (status && !isConnected) {
          const currentLocation = locationManager.getCurrentLocation();
          const pushToken = localStorage.getItem('pushToken');

          console.log(
            '[useWebSocket] Connection established, sending JOIN message'
          );
          wsRef.current.send({
            type: MessageType.JOIN,
            playerId: playerId,
            data: {
              location: currentLocation,
              playerId: playerId,
              kind: 'player',
              heading: 0,
            },
            pushToken: pushToken,
          });
        }

        setIsConnected(status);
      }
    };

    // Connection status check interval
    const statusInterval = setInterval(handleConnectionStatus, 1000);

    // Initial connection
    wsRef.current.connect();

    // Only cleanup the status interval
    return () => {
      clearInterval(statusInterval);
    };
  }, [playerId, isConnected]);

  const addMessageListener = useCallback(
    (callback: (message: GameMessage) => void) => {
      if (!wsRef.current) {
        console.warn('[useWebSocket] WebSocket service not initialized');
        return () => {};
      }

      console.log('[useWebSocket] Adding message listener');
      wsRef.current.addMessageListener(callback);
      return () => {
        console.log('[useWebSocket] Removing message listener');
        wsRef.current?.removeMessageListener(callback);
      };
    },
    []
  );

  const send = useCallback((message: GameMessage) => {
    if (!wsRef.current) {
      console.warn(
        '[useWebSocket] Cannot send message - service not initialized'
      );
      return;
    }
    wsRef.current.send(message);
  }, []);

  const reconnect = useCallback(() => {
    if (!wsRef.current) {
      console.warn('[useWebSocket] Cannot reconnect - service not initialized');
      return;
    }
    wsRef.current.reconnect();
  }, []);

  return {
    wsInstance: wsRef.current,
    isConnected,
    addMessageListener,
    send,
    reconnect,
  };
};

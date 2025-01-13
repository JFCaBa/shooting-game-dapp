import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { GameMessage, MessageType } from '../types/game';
import { LocationStateManager } from '../services/LocationStateManager';

interface WebSocketContextType {
  wsInstance: WebSocketService | null;
  isConnected: boolean;
  send: (message: GameMessage) => void;
  addMessageListener: (callback: (message: GameMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const wsRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const locationManager = LocationStateManager.getInstance();

  // Initialize WebSocket service
  useEffect(() => {
    wsRef.current = WebSocketService.getInstance();

    const handleConnectionStatus = () => {
      if (wsRef.current) {
        const status = wsRef.current.getConnectionStatus();
        setIsConnected(status);
      }
    };

    // Connection status check interval
    const statusInterval = setInterval(handleConnectionStatus, 1000);

    // Initial connection
    wsRef.current.connect();

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  const send = (message: GameMessage) => {
    if (!wsRef.current) {
      console.warn(
        '[WebSocketContext] Cannot send message - service not initialized'
      );
      return;
    }
    wsRef.current.send(message);
  };

  const addMessageListener = (callback: (message: GameMessage) => void) => {
    if (!wsRef.current) {
      console.warn('[WebSocketContext] WebSocket service not initialized');
      return () => {};
    }

    return wsRef.current.addMessageListener(callback);
  };

  const value = {
    wsInstance: wsRef.current,
    isConnected,
    send,
    addMessageListener,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

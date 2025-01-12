import React, { createContext, useContext, useEffect, useState } from 'react';
import { webSocketPersistentService } from '../services/WebSocketPersistentService';
import { generateTemporaryId } from '../utils/uuid';

interface AppContextType {
  playerId: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playerId] = useState(() => {
    const storedId = localStorage.getItem('playerId');
    if (storedId) return storedId;

    const newId = generateTemporaryId();
    localStorage.setItem('playerId', newId);
    return newId;
  });

  useEffect(() => {
    // Initialize WebSocket service at app level
    webSocketPersistentService.initialize(playerId);
  }, [playerId]);

  return (
    <AppContext.Provider value={{ playerId }}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

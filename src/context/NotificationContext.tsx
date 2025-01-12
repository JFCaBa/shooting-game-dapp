import React, { createContext, useContext, useEffect, useState } from 'react';
import { MessagePayload } from 'firebase/messaging';
import { firebaseService } from '../services/FirebaseService';
import { MessageType } from '../types/game';

interface NotificationContextType {
  pushToken: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pushToken, setPushToken] = useState<string | null>(
    localStorage.getItem('pushToken')
  );
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    const setupNotifications = async () => {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
      }

      // Check if Firebase is properly initialized
      if (!firebaseService.isReady()) {
        console.error('Firebase is not properly initialized');
        return;
      }

      // Setup message listener for foreground notifications
      firebaseService.setupMessageListener((payload: MessagePayload) => {
        handleNotification(payload);
      });

      // Check existing permission
      const permission = Notification.permission;
      setHasPermission(permission === 'granted');

      // If already granted, get token
      if (permission === 'granted') {
        const token = await firebaseService.requestPermission();
        if (token) {
          setPushToken(token);
        }
      }
    };

    setupNotifications();
  }, []);

  const handleNotification = (payload: MessagePayload) => {
    // Handle foreground notifications
    if (Notification.permission === 'granted' && payload.notification) {
      const { title, body } = payload.notification;
      new Notification(title!, {
        body,
        icon: '/logo192.png',
      });
    }
  };

  const requestPermission = async () => {
    const token = await firebaseService.requestPermission();
    if (token) {
      setPushToken(token);
      setHasPermission(true);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        pushToken,
        hasPermission,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketContext';
import { GameProvider } from './context/GameContext';
import { LocationProvider } from './context/LocationContext';
import { AchievementsProvider } from './context/AchievementsContext';
import { WalletProvider } from './context/WalletContext';
import { NotificationProvider } from './context/NotificationContext';
import GameLayout from './layouts/GameLayout';
import CreateUser from './pages/CreateUser';
import Login from './pages/Login';
import Profile from './pages/Profile';
import DevicePermissionsHandler from './components/permissions/DevicePermissionsHandler';
import { adManager } from './services/AdManager';

const App = () => {
  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'production') {
        console.log('Initializing AdManager in production mode');
        adManager.isSupported();
      }
    } catch (error) {
      console.error('Error initializing AdManager:', error);
    }
  }, []);

  return (
    <Router>
      <WebSocketProvider>
        <WalletProvider>
          <LocationProvider>
            <NotificationProvider>
              <GameProvider>
                <AchievementsProvider>
                  <DevicePermissionsHandler>
                    <Routes>
                      <Route path="/create-user" element={<CreateUser />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/*" element={<GameLayout />} />
                    </Routes>
                  </DevicePermissionsHandler>
                </AchievementsProvider>
              </GameProvider>
            </NotificationProvider>
          </LocationProvider>
        </WalletProvider>
      </WebSocketProvider>
    </Router>
  );
};

export default App;

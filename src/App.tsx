import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketContext';
import { GameProvider } from './context/GameContext';
import { LocationProvider } from './context/LocationContext';
import { AchievementsProvider } from './context/AchievementsContext';
import { WalletProvider } from './context/WalletContext';
import { NotificationProvider } from './context/NotificationContext';
import { InventoryProvider } from './context/InventoryContext';
import { CameraProvider } from './context/CameraContext';
import GameLayout from './layouts/GameLayout';
import CreateUser from './pages/CreateUser';
import Login from './pages/Login';
import Profile from './pages/Profile';
import DevicePermissionsHandler from './components/permissions/DevicePermissionsHandler';
import { adService } from './services/AdService';

const App = () => {
  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'production') {
        console.log('Initializing adService in production mode');
        adService.isSupported();
      }
    } catch (error) {
      console.error('Error initializing adService:', error);
    }
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <WebSocketProvider>
        <WalletProvider>
          <LocationProvider>
            <NotificationProvider>
              <GameProvider>
                <InventoryProvider>
                  <AchievementsProvider>
                    <CameraProvider>
                      <DevicePermissionsHandler>
                        <Routes>
                          <Route path="/create-user" element={<CreateUser />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/*" element={<GameLayout />} />
                        </Routes>
                      </DevicePermissionsHandler>
                    </CameraProvider>
                  </AchievementsProvider>
                </InventoryProvider>
              </GameProvider>
            </NotificationProvider>
          </LocationProvider>
        </WalletProvider>
      </WebSocketProvider>
    </Router>
  );
};

export default App;

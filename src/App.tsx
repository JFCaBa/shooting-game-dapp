import React, { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { LocationProvider } from './context/LocationContext';
import { Game } from './pages/Game';
import Map from './pages/Map';
import Inventory from './pages/Inventory';
import NavigationMenu from './components/navigation/NavigationMenu';
import { ComingSoon } from './components/modals/ComingSoon';
import { Screen } from './types/navigation';
import DevicePermissionsHandler from './components/permissions/DevicePermissionsHandler';
import { adManager } from './services/AdManager';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('game');
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    // Initialize AdManager when app starts
    try {
      if (process.env.NODE_ENV === 'production') {
        console.log('Initializing AdManager in production mode');
        // AdManager will self-initialize through getInstance
        adManager.isSupported();
      }
    } catch (error) {
      console.error('Error initializing AdManager:', error);
    }
  }, []);

  const handleScreenChange = (screen: Screen) => {
    if (screen === 'game' || screen === 'map' || screen === 'inventory') {
      setCurrentScreen(screen);
    } else {
      setShowComingSoon(true);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'game':
        return <Game />;
      case 'map':
        return <Map />;
      case 'inventory':
        return <Inventory />;
      default:
        return <Game />;
    }
  };

  return (
    <LocationProvider>
      <GameProvider>
        <DevicePermissionsHandler>
          <div className="h-screen w-screen overflow-hidden bg-game-dark flex flex-col">
            {/* Main content area */}
            <div className="flex-1 relative">{renderScreen()}</div>
            {/* Navigation */}
            <NavigationMenu
              currentScreen={currentScreen}
              onScreenChange={handleScreenChange}
            />
            {/* Modals */}
            {showComingSoon && (
              <ComingSoon onClose={() => setShowComingSoon(false)} />
            )}
          </div>
        </DevicePermissionsHandler>
      </GameProvider>
    </LocationProvider>
  );
};

export default App;

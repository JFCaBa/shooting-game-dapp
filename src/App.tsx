// src/App.tsx
// Main application component
// Route: /

import React, { useState } from 'react';
import { GameProvider } from './context/GameContext';
import { LocationProvider } from './context/LocationContext';
import { Game }  from './pages/Game';
import Map from './pages/Map';
import NavigationMenu from './components/navigation/NavigationMenu';
import { ComingSoon } from './components/modals/ComingSoon';

type Screen = 'game' | 'map' | 'achievements' | 'wallet' | 'settings';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('game');
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleScreenChange = (screen: Screen) => {
    if (screen === 'game' || screen === 'map') {
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
      default:
        return <Game />;
    }
  };

  return (
    <LocationProvider>
      <GameProvider>
        <div className="h-screen w-screen overflow-hidden bg-game-dark flex flex-col">
          {/* Main content area */}
          <div className="flex-1 relative">
            {renderScreen()}
          </div>
          
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
      </GameProvider>
    </LocationProvider>
  );
};

export default App;
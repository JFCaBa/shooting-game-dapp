import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { LocationProvider } from './context/LocationContext';
import { Game } from './pages/Game';
import Map from './pages/Map';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import CreateUser from './pages/CreateUser';
import Login from './pages/Login';
import Profile from './pages/Profile';
import NavigationMenu from './components/navigation/NavigationMenu';
import { ComingSoon } from './components/modals/ComingSoon';
import { Screen } from './types/navigation';
import DevicePermissionsHandler from './components/permissions/DevicePermissionsHandler';
import { adManager } from './services/AdManager';

// AuthBanner component for unauthenticated users
const AuthBanner = ({
  onClose,
  onCreateUser,
}: {
  onClose: () => void;
  onCreateUser: () => void;
}) => (
  <div className="absolute top-0 left-0 right-0 bg-game-secondary bg-opacity-90 p-4 text-white">
    <div className="flex justify-between items-center">
      <p>Create an account to access this feature</p>
      <div className="space-x-4">
        <button
          onClick={onCreateUser}
          className="bg-white text-game-secondary px-4 py-2 rounded-lg"
        >
          Create Account
        </button>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    </div>
  </div>
);

// Main Game Layout Component
const GameLayout = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('game');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showAuthBanner, setShowAuthBanner] = useState(false);
  const navigate = useNavigate();

  const handleScreenChange = (screen: Screen) => {
    if (screen === 'create-user') {
      navigate('/create-user');
      return;
    }

    const token = localStorage.getItem('token');

    // Check if screen requires authentication
    if (
      !token &&
      ['inventory', 'achievements', 'wallet', 'hallOfFame'].includes(screen)
    ) {
      setShowAuthBanner(true);
      return;
    }

    if (
      screen === 'game' ||
      screen === 'map' ||
      screen === 'inventory' ||
      screen === 'settings'
    ) {
      setCurrentScreen(screen);
      setShowAuthBanner(false);
    } else {
      setShowComingSoon(true);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setCurrentScreen('game');
  };

  const handleCreateUser = () => {
    navigate('/create-user');
    setShowAuthBanner(false);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'game':
        return <Game />;
      case 'map':
        return <Map />;
      case 'inventory':
        return <Inventory />;
      case 'settings':
        return <Settings onSignOut={handleSignOut} />;
      default:
        return <Game />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-game-dark flex flex-col">
      {/* Main content area */}
      <div className="flex-1 relative">
        {renderScreen()}
        {showAuthBanner && (
          <AuthBanner
            onClose={() => setShowAuthBanner(false)}
            onCreateUser={handleCreateUser}
          />
        )}
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
  );
};

// Main App Component
const App = () => {
  useEffect(() => {
    // Initialize AdManager when app starts
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
      <LocationProvider>
        <GameProvider>
          <DevicePermissionsHandler>
            <Routes>
              <Route path="/create-user" element={<CreateUser />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/*" element={<GameLayout />} />
            </Routes>
          </DevicePermissionsHandler>
        </GameProvider>
      </LocationProvider>
    </Router>
  );
};

export default App;

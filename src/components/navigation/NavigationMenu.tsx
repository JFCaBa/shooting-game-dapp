import React, { useRef } from 'react';
import { FaCog } from 'react-icons/fa';
import { Screen } from '../../types/navigation';
import ShootButton from '../game/ShootButton';
import { useGameContext } from '../../context/GameContext';
import { useLocationContext } from '../../context/LocationContext';

interface NavigationMenuProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentScreen, onScreenChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { currentAmmo, isReloading, shoot } = useGameContext();
  const { location, heading } = useLocationContext();
  
  const menuItems = [
    { id: 'inventory' as Screen, label: 'INVENTORY' },
    { id: 'map' as Screen, label: 'MAP' },
    { id: 'game' as Screen, label: 'GAME' },
    { id: 'achievements' as Screen, label: 'ACHIEVEMENTS' },
    { id: 'hallOfFame' as Screen, label: 'HALLOFFAME' },
    { id: 'wallet' as Screen, label: 'WALLET' },
  ];

  const handleShoot = () => {
    if (!location || heading === null) {
      console.error('Missing location or heading data');
      return;
    }

    try {
      shoot(location, heading);
    } catch (error) {
      console.error('Failed to shoot:', error);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80">
      {/* Top row - Scrollable Menu */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`p-4 cursor-pointer ${currentScreen === item.id ? 'text-yellow-500' : 'text-white'}`}
            onClick={() => onScreenChange(item.id)}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Bottom row - Action Buttons with safe area padding */}
      <div className="flex justify-between items-center px-4 py-4 pb-safe mb-5">
        <div className="w-12" /> {/* Empty space for radar (placeholder) */}
        <ShootButton
          isReloading={isReloading}
          currentAmmo={currentAmmo}
          onShoot={handleShoot}
        />
        <button
          onClick={() => onScreenChange('settings')}
          className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center"
        >
          <FaCog className="text-white text-xl" />
        </button>
      </div>
    </nav>
    
  );
};

export default NavigationMenu;
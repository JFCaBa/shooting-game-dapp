// src/components/navigation/NavigationMenu.tsx
import React, { useRef } from 'react';
import { FaCog } from 'react-icons/fa';
import { Screen } from '../../types/navigation';

interface NavigationMenuProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentScreen, onScreenChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const menuItems = [
    { id: 'inventory' as Screen, label: 'INVENTORY' },
    { id: 'map' as Screen, label: 'MAP' },
    { id: 'game' as Screen, label: 'GAME' },
    { id: 'achievements' as Screen, label: 'ACHIEVEMENTS' },
    { id: 'hallOfFame' as Screen, label: 'HALLOFFAME' },
    { id: 'wallet' as Screen, label: 'WALLET' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 z-10"> {/* Adjusted bottom position */}
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
      <div className="flex items-center justify-end px-4 py-4">
        {/* Settings Button */}
        <button
          onClick={() => onScreenChange('settings')}
          className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center"
        >
          <FaCog className="text-white text-xl" />
        </button>
      </div>
    </div>
  );
};

export default NavigationMenu;
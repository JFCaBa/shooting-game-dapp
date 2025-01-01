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
    { id: 'hallOfFame' as Screen, label: 'HALL OF FAME' },
    { id: 'wallet' as Screen, label: 'WALLET' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 z-10">
      {/* Menu Labels */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto py-2 px-4 no-scrollbar scrolling-touch"
        >
          <div className="flex space-x-4 min-w-min">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onScreenChange(item.id)}
                className={`whitespace-nowrap text-sm ${
                  currentScreen === item.id
                    ? 'text-yellow-400'
                    : 'text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
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
// src/components/navigation/NavigationMenu.tsx
import React from 'react';
import { FaMap, FaTrophy, FaWallet, FaCog, FaGamepad } from 'react-icons/fa';
import { Screen } from '../../types/navigation';

interface NavigationMenuProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentScreen, onScreenChange }) => {
  const menuItems = [
    { id: 'game' as Screen, icon: FaGamepad, label: 'Game' },
    { id: 'map' as Screen, icon: FaMap, label: 'Map' },
    { id: 'achievements' as Screen, icon: FaTrophy, label: 'Achievements' },
    { id: 'wallet' as Screen, icon: FaWallet, label: 'Wallet' },
    { id: 'settings' as Screen, icon: FaCog, label: 'Settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4">
      <div className="flex justify-around items-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={`flex flex-col items-center p-2 rounded-full ${
              currentScreen === item.id ? 'bg-blue-500' : ''
            }`}
          >
            <item.icon className="text-2xl mb-1" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavigationMenu;
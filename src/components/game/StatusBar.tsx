// src/components/game/StatusBar.tsx
// No route - Game component
// Displays ammo and health status bars

import React from 'react';

interface StatusBarProps {
  ammo: number;
  maxAmmo: number;
  lives: number;
  maxLives: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ ammo, maxAmmo, lives, maxLives }) => {
  return (
    <div className="space-y-2">
      {/* Ammo bar */}
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6">
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
            <path d="M4 4h16v8h-8v8h-8v-16zm2 2v12h4v-8h8v-4h-12z"/>
          </svg>
        </div>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(ammo / maxAmmo) * 100}%` }}
          />
        </div>
        <span className="text-white text-sm min-w-[3rem]">{ammo}/{maxAmmo}</span>
      </div>

      {/* Health bar */}
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6">
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${(lives / maxLives) * 100}%` }}
          />
        </div>
        <span className="text-white text-sm min-w-[3rem]">{lives}/{maxLives}</span>
      </div>
    </div>
  );
};

export default StatusBar;
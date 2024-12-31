// src/pages/Game.tsx
// Route: /game
// Main game page component that handles the shooting mechanics and player interactions

import React, { useEffect, useState } from 'react';
import { useGameContext } from '../context/GameContext';
import Crosshair from '../components/game/Crosshair';
import StatusBar from '../components/game/StatusBar';
import ShootButton from '../components/game/ShootButton';
import NavigationMenu from '../components/navigation/NavigationMenu';
import { useLocationContext } from '../context/LocationContext';

// src/pages/Game.tsx

export const Game = () => {
  const { 
    currentAmmo, 
    maxAmmo,
    isReloading, 
    currentLives, 
    maxLives,
    shoot 
  } = useGameContext();
  
  const { location, heading } = useLocationContext();

  const handleShoot = () => {
    if (location) {
      shoot(location, heading);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <div className="h-full w-full relative">
        <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-50">
          <StatusBar 
            ammo={currentAmmo} 
            maxAmmo={maxAmmo}
            lives={currentLives}
            maxLives={maxLives}
          />
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Crosshair />
        </div>

        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
          <ShootButton 
            isReloading={isReloading}
            currentAmmo={currentAmmo}
            onShoot={handleShoot}
          />
        </div>

        {isReloading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-6xl">
            Reloading...
          </div>
        )}
      </div>

      <NavigationMenu 
        currentScreen="game"
        onScreenChange={() => {}}
      />
    </div>
  );
};
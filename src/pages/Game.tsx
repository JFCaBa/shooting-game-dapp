import React from 'react';
import { useGameContext } from '../context/GameContext';
import Camera from '../components/game/Camera';
import Crosshair from '../components/game/Crosshair';
import StatusBar from '../components/game/StatusBar';
import ShootButton from '../components/game/ShootButton';
import NavigationMenu from '../components/navigation/NavigationMenu';
import { useLocationContext } from '../context/LocationContext';

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
    <div className="relative h-screen w-full overflow-hidden">
      <Camera />
      
      <div className="relative h-full w-full">
        <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-50 z-10">
          <StatusBar 
            ammo={currentAmmo} 
            maxAmmo={maxAmmo}
            lives={currentLives}
            maxLives={maxLives}
          />
        </div>

        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <Crosshair />
        </div>

        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-20">
          <ShootButton
            isReloading={isReloading}
            currentAmmo={currentAmmo}
            onShoot={handleShoot}
          />
        </div>

        {isReloading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-6xl z-30">
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
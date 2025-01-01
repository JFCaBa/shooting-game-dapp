// src/components/game/ShootButton.tsx
// No route - Game component
// Shoot button with animations and feedback
import React, { useEffect, useRef } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useLocationContext } from '../../context/LocationContext';

interface ShootButtonProps {
 isReloading: boolean;
 currentAmmo: number;
 onShoot: () => void;
}

const ShootButton: React.FC<ShootButtonProps> = ({ isReloading, currentAmmo, onShoot }) => {
  const { shoot } = useGameContext();
  const { location, heading } = useLocationContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/assets/shoot_sound.wav');
    audioRef.current.load();
  }, []);

  const handleShoot = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset the audio to the start
      audioRef.current.play();
    }
    shoot(location, heading);
  };

 return (
   <button
     className={`relative w-16 h-16 rounded-full border-2 border-white 
       ${isReloading ? 'bg-red-500 opacity-50' : 'bg-red-600'}
       ${currentAmmo <= 0 ? 'opacity-50' : 'hover:bg-red-500 active:scale-95'}
       transition-all duration-150 transform`}
     onClick={handleShoot}
     disabled={isReloading || currentAmmo <= 0}
   >
     {/* Reload indicator */}
     {isReloading && (
       <div className="absolute inset-0 flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-t-4 border-white rounded-full animate-spin" />
       </div>
     )}
   </button>
 );
};

export default ShootButton;
import React, { useEffect, useRef, memo } from 'react';

interface ShootButtonProps {
  isReloading: boolean;
  currentAmmo: number;
  onShoot: () => void;
}

const ShootButton: React.FC<ShootButtonProps> = memo(
  ({ isReloading, currentAmmo, onShoot }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
      audioRef.current = new Audio('/assets/shoot_sound.wav');
      audioRef.current.load();

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }, []);

    const handleShoot = (e: React.MouseEvent) => {
      e.preventDefault();

      if (isReloading || currentAmmo <= 0) {
        console.log('Shoot blocked:', { isReloading, currentAmmo });
        return;
      }

      console.log('Shoot button pressed, dispatching gameShoot event');

      // First dispatch the gameShoot event
      const shootEvent = new CustomEvent('gameShoot');
      document.dispatchEvent(shootEvent);
      console.log('gameShoot event dispatched');

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch((error) => console.error('Failed to play sound:', error));
      }

      // Then call the onShoot handler
      onShoot();
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
        {isReloading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-t-4 border-white rounded-full animate-spin" />
          </div>
        )}
      </button>
    );
  }
);

ShootButton.displayName = 'ShootButton';

export default ShootButton;

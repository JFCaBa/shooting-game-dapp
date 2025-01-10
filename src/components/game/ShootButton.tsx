import React, { useEffect, useRef, memo } from 'react';

interface ShootButtonProps {
  isReloading: boolean;
  currentAmmo: number;
  onShoot: () => void;
}

const ShootButton: React.FC<ShootButtonProps> = memo(
  ({ isReloading, currentAmmo, onShoot }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastShootTime = useRef<number>(0);
    const SHOOT_COOLDOWN = 500; // 500ms cooldown between shots

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
      e.stopPropagation(); // Prevent event bubbling

      const now = Date.now();
      if (now - lastShootTime.current < SHOOT_COOLDOWN) {
        console.log('Shot cooldown in effect');
        return;
      }

      if (isReloading || currentAmmo <= 0) {
        console.log('Shot blocked:', { isReloading, currentAmmo });
        return;
      }

      lastShootTime.current = now;

      // First dispatch the gameShoot event
      const shootEvent = new CustomEvent('gameShoot', { bubbles: false });
      document.dispatchEvent(shootEvent);

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

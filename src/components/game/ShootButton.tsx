import React, { useRef, memo } from 'react';
import { soundService } from '../../services/SoundService';

interface ShootButtonProps {
  isReloading: boolean;
  isRecovering: boolean;
  isNotGameScreen: boolean;
  currentAmmo: number;
  onShoot: () => void;
}

const ShootButton: React.FC<ShootButtonProps> = memo(
  ({ isReloading, isRecovering, isNotGameScreen, currentAmmo, onShoot }) => {
    const lastShootTime = useRef<number>(0);
    const SHOOT_COOLDOWN = 500; // 500ms cooldown between shots

    const handleShoot = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling

      const now = Date.now();
      if (now - lastShootTime.current < SHOOT_COOLDOWN) {
        console.log('Shot cooldown in effect');
        return;
      }

      if (isReloading || currentAmmo <= 0 || isRecovering || isNotGameScreen) {
        console.log('Shot blocked:', {
          isReloading,
          currentAmmo,
          isRecovering,
        });
        return;
      }

      lastShootTime.current = now;

      // Play shoot sound
      soundService.playSound('shoot');

      // Dispatch the gameShoot event
      const shootEvent = new CustomEvent('gameShoot', { bubbles: false });
      document.dispatchEvent(shootEvent);

      // Call the onShoot handler
      onShoot();
    };

    return (
      <button
        className={`relative w-16 h-16 rounded-full border-2 border-white 
        ${isReloading || isRecovering ? 'bg-red-500 opacity-50' : 'bg-red-600'}
        ${currentAmmo <= 0 ? 'opacity-50' : 'hover:bg-red-500 active:scale-95'}
        transition-all duration-150 transform`}
        onClick={handleShoot}
        disabled={isReloading || currentAmmo <= 0 || isRecovering}
      >
        {(isReloading || isRecovering) && (
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

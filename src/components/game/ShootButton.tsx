// src/components/game/ShootButton.tsx
// No route - Game component
// Shoot button with animations and feedback

import React from 'react';

interface ShootButtonProps {
  isReloading: boolean;
  currentAmmo: number;
  onShoot: () => void;
}

const ShootButton: React.FC<ShootButtonProps> = ({ isReloading, currentAmmo, onShoot }) => {
  const handlePress = () => {
    if (!isReloading && currentAmmo > 0) {
      onShoot();
    }
  };

  return (
    <button
      className={`relative w-20 h-20 rounded-full border-4 border-white 
        ${isReloading ? 'bg-red-500 opacity-50' : 'bg-red-600'} 
        ${currentAmmo <= 0 ? 'opacity-50' : 'hover:bg-red-500 active:scale-95'}
        transition-all duration-150 transform`}
      onClick={handlePress}
      disabled={isReloading || currentAmmo <= 0}
    >
      {/* Inner circle */}
      <div className="absolute inset-4 bg-white rounded-full" />
      
      {/* Reload indicator */}
      {isReloading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-t-4 border-white rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
};

export default ShootButton;
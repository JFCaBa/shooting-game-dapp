// src/components/game/Crosshair.tsx
// No route - Game component
// Displays the shooting crosshair with recoil animation

import React, { useState, useEffect } from 'react';

const Crosshair = () => {
  const [isRecoiling, setIsRecoiling] = useState(false);

  useEffect(() => {
    const handleShoot = () => {
      setIsRecoiling(true);
      setTimeout(() => setIsRecoiling(false), 100);
    };

    window.addEventListener('click', handleShoot);
    return () => window.removeEventListener('click', handleShoot);
  }, []);

  return (
    <div className={`relative w-12 h-12 ${isRecoiling ? 'transform -translate-y-2 transition-transform' : 'transition-transform'}`}>
      {/* Vertical line */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-white opacity-80" />
      
      {/* Horizontal line */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-0.5 bg-white opacity-80" />
      
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full" />
    </div>
  );
};

export default Crosshair;
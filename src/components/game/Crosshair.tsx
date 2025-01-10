import React, { useState, useEffect, memo } from 'react';

const Crosshair = memo(() => {
  const [isRecoiling, setIsRecoiling] = useState(false);

  useEffect(() => {
    const handleShoot = (e: Event) => {
      e.stopPropagation(); // Prevent event bubbling
      if (!isRecoiling) {
        setIsRecoiling(true);
        setTimeout(() => setIsRecoiling(false), 100);
      }
    };

    document.addEventListener('gameShoot', handleShoot);
    return () => document.removeEventListener('gameShoot', handleShoot);
  }, [isRecoiling]);

  return (
    <div
      className={`relative w-12 h-12 ${
        isRecoiling
          ? 'transform -translate-y-2 transition-transform'
          : 'transition-transform'
      }`}
    >
      {/* Vertical line */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-white opacity-80" />

      {/* Horizontal line */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-0.5 bg-white opacity-80" />

      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full" />
    </div>
  );
});

Crosshair.displayName = 'Crosshair';

export default Crosshair;

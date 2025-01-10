import React, { useState, useEffect } from 'react';

const HitEffect = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleHit = () => {
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 2000);
    };

    document.addEventListener('playerHit', handleHit);
    return () => document.removeEventListener('playerHit', handleHit);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 bg-red-500 pointer-events-none animate-fadeOut"
      style={{
        mixBlendMode: 'multiply',
        animation: 'fadeOut 2s ease-out forwards',
      }}
    />
  );
};

export default HitEffect;

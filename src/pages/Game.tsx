// src/pages/Game.tsx

import React from 'react';
import { useGameContext } from '../context/GameContext';
import { useLocationContext } from '../context/LocationContext';
import Camera from '../components/game/Camera';
import ARView from '../components/ar/ARView';
import Crosshair from '../components/game/Crosshair';
import StatusBar from '../components/game/StatusBar';

export const Game = () => {
  const { 
    currentAmmo, 
    maxAmmo,
    isReloading, 
    currentLives, 
    maxLives,
    players,
    playerId
  } = useGameContext();
  
  const { location } = useLocationContext();

  // Filter out current player from the players list
  const otherPlayers = React.useMemo(() => {
    return players.filter(player => player.playerId !== playerId);
  }, [players, playerId]);

  // Debug logging
  React.useEffect(() => {
    console.log('Game component - Players update:', {
      totalPlayers: players.length,
      otherPlayers: otherPlayers.length,
      currentPlayerId: playerId
    });
  }, [players, otherPlayers, playerId]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Base layer - Camera */}
      <div className="absolute inset-0">
        <Camera />
      </div>

      {/* AR Layer */}
      {location && (
        <div className="absolute inset-0">
          <ARView players={otherPlayers} />
        </div>
      )}

      {/* UI Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-50 pointer-events-auto">
          <StatusBar 
            ammo={currentAmmo} 
            maxAmmo={maxAmmo}
            lives={currentLives}
            maxLives={maxLives}
          />
        </div>

        {/* Debug Info */}
        <div className="absolute top-20 left-4 text-white bg-black bg-opacity-50 p-2 rounded text-sm">
          <div>Total Players: {players.length}</div>
          <div>Other Players: {otherPlayers.length}</div>
          <div>Player ID: {playerId?.slice(0, 8)}...</div>
        </div>

        {/* Crosshair */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <Crosshair />
        </div>

        {/* Reloading Overlay */}
        {isReloading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-4xl">
            Reloading...
          </div>
        )}
      </div>
    </div>
  );
};
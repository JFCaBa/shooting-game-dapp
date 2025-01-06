// src/pages/Game.tsx
import React, { useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import { useLocationContext } from '../context/LocationContext';
import Camera from '../components/game/Camera';
import ARView from '../components/ar/ARView';
import Crosshair from '../components/game/Crosshair';
import StatusBar from '../components/game/StatusBar';
import GameStatus from '../components/game/GameStatus';
import { WebSocketService } from '../services/WebSocketService';
import { MessageType } from '../types/game';

export const Game = () => {
  const {
    currentAmmo,
    maxAmmo,
    isReloading,
    currentLives,
    maxLives,
    players,
    playerId,
    drones,
    gameScore,
    shoot,
    updateGameScore,
  } = useGameContext();
  const { location, heading } = useLocationContext();

  // Keep track of other players for debugging/monitoring
  const otherPlayers = React.useMemo(() => {
    return players.filter((player) => player.playerId !== playerId);
  }, [players, playerId]);

  // MARK: - handleDroneHit

  const handleDroneHit = useCallback(
    (droneId: string) => {
      console.log('Drone hit:', droneId);
      // Send WebSocket message for drone hit
      const wsService = WebSocketService.getInstance();
      wsService.send({
        type: MessageType.SHOOT_DRONE,
        playerId: playerId!,
        data: {
          droneId: droneId,
          position: {
            x: 0,
            y: 0,
            z: 0,
          },
          kind: 'drone',
        },
      });

      // Update local game score
      updateGameScore({
        type: 'DRONE_HIT',
        droneId: droneId,
      });

      // Trigger shoot animation and sound
      // shoot(location, heading);
    },
    [location, heading, playerId, updateGameScore, shoot]
  );

  React.useEffect(() => {
    console.log('Game component - Update:', {
      totalPlayers: players.length,
      otherPlayers: otherPlayers.length,
      currentPlayerId: playerId,
      activeDrones: drones.length,
    });
  }, [players, otherPlayers, playerId, drones]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Base layer - Camera */}
      <div className="absolute inset-0">
        <Camera />
      </div>

      {/* AR Layer */}
      {location && (
        <div className="absolute inset-0">
          <ARView drones={drones} onDroneShoot={handleDroneHit} />
        </div>
      )}

      {/* UI Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-80 pointer-events-auto">
          <StatusBar
            ammo={currentAmmo}
            maxAmmo={maxAmmo}
            lives={currentLives}
            maxLives={maxLives}
          />
          {/* Game status */}
          <GameStatus
            droneCount={drones.length}
            hits={gameScore.hits}
            kills={gameScore.kills}
            isOnline={navigator.onLine}
            isWebSocketConnected={WebSocketService.getInstance().isConnected}
          />
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

// src/pages/Game.tsx
import React, { useCallback, useMemo } from 'react';
import { useGameContext } from '../context/GameContext';
import { useLocationContext } from '../context/LocationContext';
import Camera from '../components/game/Camera';
import ARView from '../components/ar/ARView';
import Crosshair from '../components/game/Crosshair';
import StatusBar from '../components/game/StatusBar';
import GameStatus from '../components/game/GameStatus';
import RewardAdModal from '../components/modals/RewardAdModal';
import { WebSocketService } from '../services/WebSocketService';
import { MessageType } from '../types/game';

export const Game = React.memo(() => {
  const {
    currentAmmo,
    maxAmmo,
    isReloading,
    currentLives,
    maxLives,
    players,
    playerId,
    drones,
    geoObjects,
    gameScore,
    updateGameScore,
    handleAdReward,
    closeAdModal,
    showAdModal,
  } = useGameContext();
  const { location } = useLocationContext();

  // Memoize other players calculation
  const otherPlayers = useMemo(() => {
    return players.filter((player) => player.playerId !== playerId);
  }, [players, playerId]);

  // Memoize WebSocket service instance
  const wsService = useMemo(() => WebSocketService.getInstance(), []);

  // Memoize handlers
  const handleDroneHit = useCallback(
    (droneId: string) => {
      console.log('Drone hit:', droneId);
      wsService.send({
        type: MessageType.SHOOT_DRONE,
        playerId: playerId!,
        data: {
          droneId: droneId,
          position: { x: 0, y: 0, z: 0 },
          kind: 'drone',
        },
      });

      updateGameScore({
        type: 'DRONE_HIT',
        droneId: droneId,
      });
    },
    [playerId, updateGameScore, wsService]
  );

  const handleGeoObjectHit = useCallback(
    (geoObjectId: string) => {
      if (!playerId || !location) return;

      const targetObject = geoObjects?.find((obj) => obj.id === geoObjectId);
      if (!targetObject) return;

      wsService.send({
        type: MessageType.GEO_OBJECT_HIT,
        playerId: playerId,
        data: {
          geoObject: targetObject,
          location: location,
          kind: 'geoObject',
        },
      });

      updateGameScore({
        type: 'GEO_OBJECT_HIT',
        geoObjectId: geoObjectId,
      });

      // Play collection sound
      const audio = new Audio('/assets/collect_sound.wav');
      audio.play().catch(console.error);

      // Show reward message if applicable
      if (targetObject.metadata?.reward) {
        document.dispatchEvent(
          new CustomEvent('showReward', {
            detail: {
              message: `+${targetObject.metadata.reward}`,
              position: { x: window.innerWidth / 2, y: window.innerHeight / 3 },
            },
          })
        );
      }
    },
    [playerId, geoObjects, location, wsService, updateGameScore]
  );

  // Memoize AR view to prevent unnecessary re-renders
  const arView = useMemo(() => {
    if (!location) return null;
    return (
      <div className="absolute inset-0">
        <ARView
          drones={drones}
          geoObjects={geoObjects}
          onDroneShoot={handleDroneHit}
          onGeoObjectHit={handleGeoObjectHit}
        />
      </div>
    );
  }, [location, drones, geoObjects, handleDroneHit, handleGeoObjectHit]);

  // Memoize status components
  const statusBar = useMemo(
    () => (
      <StatusBar
        ammo={currentAmmo}
        maxAmmo={maxAmmo}
        lives={currentLives}
        maxLives={maxLives}
      />
    ),
    [currentAmmo, maxAmmo, currentLives, maxLives]
  );

  const gameStatus = useMemo(
    () => (
      <GameStatus
        droneCount={drones.length}
        hits={gameScore.hits}
        kills={gameScore.kills}
        isOnline={navigator.onLine}
        isWebSocketConnected={wsService.isConnected}
      />
    ),
    [drones.length, gameScore.hits, gameScore.kills, wsService.isConnected]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Base layer - Camera */}
      <div className="absolute inset-0">
        <Camera />
      </div>

      {/* AR Layer */}
      {arView}

      {/* UI Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-80 pointer-events-auto">
          {statusBar}
          {gameStatus}
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

        {/* Ad Modal */}
        {showAdModal && (
          <RewardAdModal
            type={showAdModal}
            onClose={() => {
              console.log('Modal close requested');
              closeAdModal();
            }}
            onReward={() => {
              console.log('Reward requested');
              handleAdReward();
            }}
          />
        )}
      </div>
    </div>
  );
});

Game.displayName = 'Game';

export default Game;

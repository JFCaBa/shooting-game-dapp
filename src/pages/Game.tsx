// src/pages/Game.tsx
import React, { useCallback } from 'react';
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
import { DroneType } from '../types/drone';

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
    geoObjects,
    gameScore,
    updateGameScore,
    setGeoObjects,
    showAdModal,
    handleAdReward,
    closeAdModal,
  } = useGameContext();
  const { location } = useLocationContext();

  // Keep track of other players for debugging/monitoring
  const otherPlayers = React.useMemo(() => {
    return players.filter((player) => player.playerId !== playerId);
  }, [players, playerId]);

  const handleDroneHit = useCallback(
    (droneId: string) => {
      console.log('Drone hit:', droneId);
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

      updateGameScore({
        type: 'DRONE_HIT',
        droneId: droneId,
      });
    },
    [playerId, updateGameScore]
  );

  const handleGeoObjectHit = useCallback(
    (geoObjectId: string) => {
      console.log('GeoObject hit:', geoObjectId);
      const targetObject = geoObjects?.find((obj) => obj.id === geoObjectId);

      if (!targetObject) return;

      const wsService = WebSocketService.getInstance();
      wsService.send({
        type: MessageType.GEO_OBJECT_HIT,
        playerId: playerId!,
        data: {
          geoObject: targetObject,
          location: location,
          kind: 'geoObject',
        },
      });

      // Remove the object from the game context
      setGeoObjects((prevObjects) =>
        prevObjects.filter((obj) => obj.id !== geoObjectId)
      );

      updateGameScore({
        type: 'GEO_OBJECT_HIT',
        geoObjectId: geoObjectId,
      });

      // Play collection sound
      const audio = new Audio('/assets/collect_sound.wav');
      audio.play().catch(console.error);

      // Show reward message if applicable
      if (targetObject.metadata?.reward) {
        const message = `+${targetObject.metadata.reward}`;
        document.dispatchEvent(
          new CustomEvent('showReward', {
            detail: {
              message,
              position: { x: window.innerWidth / 2, y: window.innerHeight / 3 },
            },
          })
        );
      }
    },
    [playerId, geoObjects, location, setGeoObjects, updateGameScore]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Base layer - Camera */}
      <div className="absolute inset-0">
        <Camera />
      </div>

      {/* AR Layer */}
      {location && (
        <div className="absolute inset-0">
          <ARView
            drones={drones}
            geoObjects={geoObjects}
            onDroneShoot={handleDroneHit}
            onGeoObjectHit={handleGeoObjectHit}
          />
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
};

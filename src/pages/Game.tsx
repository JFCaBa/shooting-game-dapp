import React, { useCallback, useEffect, useRef } from 'react';
import { useGameContext } from '../context/GameContext';
import { useWebSocket } from '../context/WebSocketContext';
import Camera from '../components/game/Camera';
import ARView from '../components/ar/ARView';
import Crosshair from '../components/game/Crosshair';
import StatusBar from '../components/game/StatusBar';
import GameStatus from '../components/game/GameStatus';
import RewardAdModal from '../components/modals/RewardAdModal';
import HitEffect from '../components/game/HitEffect';
import { MessageType } from '../types/game';

export const Game = React.memo(() => {
  const {
    currentAmmo,
    maxAmmo,
    isReloading,
    isRecovering,
    currentLives,
    maxLives,
    playerId,
    drones,
    geoObjects,
    gameScore,
    updateGameScore,
    handleAdReward,
    closeAdModal,
    showAdModal,
  } = useGameContext();

  const { isConnected, send } = useWebSocket();
  const arViewRef = useRef<{ cleanup: () => void }>();

  const handleDroneHit = useCallback(
    (droneId: string) => {
      if (!playerId) return;

      console.log('[Game] Drone hit:', droneId);
      send({
        type: MessageType.SHOOT_DRONE,
        playerId: playerId,
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
    [playerId, send, updateGameScore]
  );

  const handleGeoObjectHit = useCallback(
    (geoObjectId: string) => {
      if (!playerId) return;

      const targetObject = geoObjects?.find((obj) => obj.id === geoObjectId);
      if (!targetObject) return;

      send({
        type: MessageType.GEO_OBJECT_HIT,
        playerId: playerId,
        data: {
          geoObject: targetObject,
          kind: 'geoObject',
        },
      });

      updateGameScore({
        type: 'GEO_OBJECT_HIT',
        geoObjectId: geoObjectId,
      });

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
    [playerId, geoObjects, send, updateGameScore]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <Camera />
      </div>

      <div className="absolute inset-0">
        <ARView
          ref={arViewRef}
          drones={drones}
          geoObjects={geoObjects}
          onDroneShoot={handleDroneHit}
          onGeoObjectHit={handleGeoObjectHit}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-80 pointer-events-auto">
          <StatusBar
            ammo={currentAmmo}
            maxAmmo={maxAmmo}
            lives={currentLives}
            maxLives={maxLives}
          />
          <GameStatus
            droneCount={drones.length}
            hits={gameScore.hits}
            kills={gameScore.kills}
            isOnline={navigator.onLine}
            isWebSocketConnected={isConnected}
          />
        </div>

        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <Crosshair />
        </div>

        {isReloading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-4xl">
            Reloading...
          </div>
        )}

        {isRecovering && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-4xl">
            Recovering...
          </div>
        )}

        <HitEffect />

        {showAdModal && (
          <RewardAdModal
            type={showAdModal}
            onClose={closeAdModal}
            onReward={handleAdReward}
          />
        )}
      </div>
    </div>
  );
});

Game.displayName = 'Game';

export default Game;

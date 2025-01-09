import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useLocationContext } from '../../context/LocationContext';
import { DroneData } from '../../types/drone';
import { GeoObject } from '../../types/game';
import { ARSceneManager } from './scene/ARSceneManager';
import { HitDetector } from './hit-detection/HitDetector';
import { SmokeEffect } from './effects/SmokeEffect';
import ARDroneModel from './ARDroneModel';
import GeoObjectNode from './GeoObjectNode';
import { calculateDistance } from '../../utils/maths';

interface ARViewProps {
  drones?: DroneData[];
  geoObjects?: GeoObject[];
  onDroneShoot?: (droneId: string) => void;
  onGeoObjectHit?: (geoObjectId: string) => void;
}

const MAX_GEOOBJECT_DISTANCE = 25;

const ARView: React.FC<ARViewProps> = ({
  drones = [],
  geoObjects = [],
  onDroneShoot,
  onGeoObjectHit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<ARSceneManager>();
  const hitDetectorRef = useRef<HitDetector>();
  const { location, heading } = useLocationContext();

  const visibleGeoObjects = useMemo(() => {
    if (!location) return [];
    return geoObjects.filter((geoObject) => {
      const distance = calculateDistance(location, geoObject.coordinate);
      return distance <= MAX_GEOOBJECT_DISTANCE;
    });
  }, [geoObjects, location]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new ARSceneManager(containerRef.current);
    sceneManagerRef.current = sceneManager;
    hitDetectorRef.current = new HitDetector(
      sceneManager.getScene(),
      sceneManager.getCamera()
    );

    const animate = () => {
      sceneManager.update();
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => sceneManager.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sceneManager.cleanup();
    };
  }, []);

  useEffect(() => {
    const handleShoot = () => {
      if (hitDetectorRef.current) {
        hitDetectorRef.current.checkHit((droneId) => {
          if (onDroneShoot) {
            onDroneShoot(droneId);
            new SmokeEffect(
              sceneManagerRef.current.getScene(),
              new THREE.Vector3(0, 0, 0)
            );
          }
        }, onGeoObjectHit);
      }
    };

    document.addEventListener('gameShoot', handleShoot);
    return () => document.removeEventListener('gameShoot', handleShoot);
  }, [onDroneShoot, onGeoObjectHit]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {sceneManagerRef.current && (
        <>
          {drones.map((drone) => (
            <ARDroneModel
              key={drone.droneId}
              drone={drone}
              onHit={onDroneShoot}
              modelUrl="/models/drone_four_rotor_one.glb"
              scene={sceneManagerRef.current.getScene()}
              camera={sceneManagerRef.current.getCamera()}
            />
          ))}
          {visibleGeoObjects.map((geoObject) => (
            <GeoObjectNode
              key={geoObject.id}
              geoObject={geoObject}
              onHit={onGeoObjectHit}
              scene={sceneManagerRef.current.getScene()}
              camera={sceneManagerRef.current.getCamera()}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default ARView;

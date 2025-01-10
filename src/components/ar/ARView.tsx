import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useLocationContext } from '../../context/LocationContext';
import { DroneData } from '../../types/drone';
import { GeoObject } from '../../types/game';
import { ARSceneManager } from './scene/ARSceneManager';
import { HitDetector } from './hit-detection/HitDetector';
import { SmokeEffect } from './effects/SmokeEffect';
import ARDroneModel from './ARDroneModel';
import GeoObjectNode from './GeoObjectNode';
import Camera from '../game/Camera';
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
  const effectsRef = useRef<Set<SmokeEffect>>(new Set());
  const isDestroyedRef = useRef(false);
  const { location } = useLocationContext();

  // MARK: - Cleanup handler
  const cleanup = useCallback(() => {
    isDestroyedRef.current = true;

    // Cleanup effects
    effectsRef.current.forEach((effect) => effect.destroy());
    effectsRef.current.clear();

    // Cleanup scene manager
    if (sceneManagerRef.current) {
      sceneManagerRef.current.cleanup();
      sceneManagerRef.current = undefined;
    }

    hitDetectorRef.current = undefined;

    // Force garbage collection hint
    if (typeof window.gc === 'function') {
      window.gc();
    }
  }, []);

  // MARK: - Filter visible geo objects based on distance
  const visibleGeoObjects = useMemo(() => {
    if (!location) return [];
    return geoObjects.filter((geoObject) => {
      const distance = calculateDistance(location, geoObject.coordinate);
      return distance <= MAX_GEOOBJECT_DISTANCE;
    });
  }, [geoObjects, location]);

  // MARK: - Create smoke effect
  const createSmokeEffect = useCallback((position: THREE.Vector3) => {
    if (!sceneManagerRef.current?.isActive()) return;

    const effect = new SmokeEffect(
      sceneManagerRef.current.getScene(),
      position,
      {
        color: 0xff0000,
        particleCount: 75,
        duration: 2000,
      }
    );

    effectsRef.current.add(effect);
    setTimeout(() => effectsRef.current.delete(effect), 1000);
  }, []);

  // MARK: - Handle shooting
  const handleShoot = useCallback(() => {
    if (!hitDetectorRef.current || !sceneManagerRef.current?.isActive()) return;

    hitDetectorRef.current.checkHit(
      (droneId: string, hitPosition: THREE.Vector3, drone: THREE.Group) => {
        if (onDroneShoot) {
          onDroneShoot(droneId);
          createSmokeEffect(hitPosition);
        }
      },
      (geoObjectId: string, hitPosition: THREE.Vector3) => {
        if (onGeoObjectHit) {
          onGeoObjectHit(geoObjectId);
          createSmokeEffect(hitPosition);
        }
      }
    );
  }, [onDroneShoot, onGeoObjectHit, createSmokeEffect]);

  // MARK: - Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Initialize scene manager
      const sceneManager = new ARSceneManager(containerRef.current);
      sceneManagerRef.current = sceneManager;

      // Initialize hit detector
      hitDetectorRef.current = new HitDetector(
        sceneManager.getScene(),
        sceneManager.getCamera()
      );

      // Start animation loop
      sceneManager.startAnimation();

      // Handle window resize
      const handleResize = () => {
        if (!isDestroyedRef.current && sceneManager.isActive()) {
          sceneManager.handleResize();
        }
      };
      window.addEventListener('resize', handleResize);

      // MARK: - Request device orientation permission if needed
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((response: string) => {
            console.log('Device orientation permission:', response);
          })
          .catch(console.error);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        cleanup();
      };
    } catch (error) {
      console.error('Failed to initialize AR scene:', error);
      throw error;
    }
  }, [cleanup]);

  // MARK: - Setup shoot event listener
  useEffect(() => {
    document.addEventListener('gameShoot', handleShoot);
    return () => document.removeEventListener('gameShoot', handleShoot);
  }, [handleShoot]);

  // MARK: - Check WebGL support
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl =
          canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          throw new Error('WebGL not supported');
        }
      } catch (e) {
        console.error('WebGL not supported:', e);
        throw new Error('WebGL is not supported in this browser');
      }
    };
    checkWebGL();
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Base layer - Camera */}
      <div className="absolute inset-0">
        <Camera />
      </div>

      {/* AR Overlay - Three.js canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ backgroundColor: 'transparent' }}
      >
        {sceneManagerRef.current?.isActive() && (
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
    </div>
  );
};

export default ARView;

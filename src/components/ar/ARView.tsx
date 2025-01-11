import React, { useEffect, useRef, memo, useState } from 'react';
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

// Separate memoized components for Drones and GeoObjects
const MemoizedDrones = memo(
  ({
    drones,
    onDroneShoot,
    sceneManager,
  }: {
    drones: DroneData[];
    onDroneShoot?: (droneId: string) => void;
    sceneManager: ARSceneManager;
  }) => {
    return (
      <>
        {drones.map((drone) => (
          <ARDroneModel
            key={drone.droneId}
            drone={drone}
            onHit={onDroneShoot}
            modelUrl="/models/drone_four_rotor_one.glb"
            scene={sceneManager.getScene()}
            camera={sceneManager.getCamera()}
          />
        ))}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return (
      JSON.stringify(prevProps.drones) === JSON.stringify(nextProps.drones)
    );
  }
);

const MemoizedGeoObjects = memo(
  ({
    geoObjects,
    onGeoObjectHit,
    sceneManager,
    maxDistance,
    currentLocation,
  }: {
    geoObjects: GeoObject[];
    onGeoObjectHit?: (geoObjectId: string) => void;
    sceneManager: ARSceneManager;
    maxDistance: number;
    currentLocation: THREE.Vector3 | null;
  }) => {
    const visibleGeoObjects = geoObjects.filter((geoObject) => {
      if (!currentLocation) return false;
      const distance = calculateDistance(
        {
          latitude: currentLocation.x,
          longitude: currentLocation.z,
          altitude: currentLocation.y,
          accuracy: 0,
        },
        geoObject.coordinate
      );
      return distance <= maxDistance;
    });

    return (
      <>
        {visibleGeoObjects.map((geoObject) => (
          <GeoObjectNode
            key={geoObject.id}
            geoObject={geoObject}
            onHit={onGeoObjectHit}
            scene={sceneManager.getScene()}
            camera={sceneManager.getCamera()}
          />
        ))}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return (
      JSON.stringify(prevProps.geoObjects) ===
        JSON.stringify(nextProps.geoObjects) &&
      prevProps.currentLocation === nextProps.currentLocation
    );
  }
);

export const ARView = memo(
  ({
    drones = [],
    geoObjects = [],
    onDroneShoot,
    onGeoObjectHit,
  }: ARViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneManagerRef = useRef<ARSceneManager>();
    const hitDetectorRef = useRef<HitDetector>();
    const effectsRef = useRef<Set<SmokeEffect>>(new Set());
    const isDestroyedRef = useRef(false);
    const { location } = useLocationContext();
    const [currentLocation, setCurrentLocation] =
      useState<THREE.Vector3 | null>(null);

    // Initialize scene
    useEffect(() => {
      if (!containerRef.current) return;

      try {
        const sceneManager = new ARSceneManager(containerRef.current);
        sceneManagerRef.current = sceneManager;
        hitDetectorRef.current = new HitDetector(
          sceneManager.getScene(),
          sceneManager.getCamera()
        );

        sceneManager.startAnimation();

        const handleResize = () => {
          if (!isDestroyedRef.current && sceneManager.isActive()) {
            sceneManager.handleResize();
          }
        };

        window.addEventListener('resize', handleResize);
        return () => {
          window.removeEventListener('resize', handleResize);
          isDestroyedRef.current = true;
          effectsRef.current.forEach((effect) => effect.destroy());
          effectsRef.current.clear();
          sceneManager.cleanup();
        };
      } catch (error) {
        console.error('Failed to initialize AR scene:', error);
        throw error;
      }
    }, []);

    // Update current location
    useEffect(() => {
      if (location) {
        setCurrentLocation(
          new THREE.Vector3(
            location.latitude,
            location.altitude,
            location.longitude
          )
        );
      }
    }, [location]);

    // Handle shooting
    useEffect(() => {
      const handleShoot = () => {
        if (!hitDetectorRef.current || !sceneManagerRef.current?.isActive())
          return;

        hitDetectorRef.current.checkHit(
          (droneId: string, hitPosition: THREE.Vector3) => {
            onDroneShoot?.(droneId);
            createSmokeEffect(hitPosition);
          },
          (geoObjectId: string, hitPosition: THREE.Vector3) => {
            onGeoObjectHit?.(geoObjectId);
            createSmokeEffect(hitPosition);
          }
        );
      };

      document.addEventListener('gameShoot', handleShoot);
      return () => document.removeEventListener('gameShoot', handleShoot);
    }, [onDroneShoot, onGeoObjectHit]);

    const createSmokeEffect = (position: THREE.Vector3) => {
      if (!sceneManagerRef.current?.isActive()) return;

      const effect = new SmokeEffect(
        sceneManagerRef.current.getScene(),
        position,
        { color: 0xff0000, particleCount: 75, duration: 2000 }
      );

      effectsRef.current.add(effect);
      setTimeout(() => effectsRef.current.delete(effect), 1000);
    };

    if (!sceneManagerRef.current?.isActive()) return null;

    return (
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <Camera />
        </div>
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ backgroundColor: 'transparent' }}
        >
          {sceneManagerRef.current && (
            <>
              <MemoizedDrones
                drones={drones}
                onDroneShoot={onDroneShoot}
                sceneManager={sceneManagerRef.current}
              />
              <MemoizedGeoObjects
                geoObjects={geoObjects}
                onGeoObjectHit={onGeoObjectHit}
                sceneManager={sceneManagerRef.current}
                maxDistance={MAX_GEOOBJECT_DISTANCE}
                currentLocation={currentLocation}
              />
            </>
          )}
        </div>
      </div>
    );
  }
);

ARView.displayName = 'ARView';
MemoizedDrones.displayName = 'MemoizedDrones';
MemoizedGeoObjects.displayName = 'MemoizedGeoObjects';

export default ARView;

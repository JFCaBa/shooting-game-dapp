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
  const { location, heading } = useLocationContext();

  // Filter visible geo objects based on distance
  const visibleGeoObjects = useMemo(() => {
    if (!location) return [];
    return geoObjects.filter((geoObject) => {
      const distance = calculateDistance(location, geoObject.coordinate);
      return distance <= MAX_GEOOBJECT_DISTANCE;
    });
  }, [geoObjects, location]);

  // Initialize scene and hit detection
  useEffect(() => {
    console.log('Initializing AR View');
    if (!containerRef.current) return;

    try {
      // Create scene manager
      const sceneManager = new ARSceneManager(containerRef.current);
      sceneManagerRef.current = sceneManager;

      // Create hit detector
      hitDetectorRef.current = new HitDetector(
        sceneManager.getScene(),
        sceneManager.getCamera()
      );

      // Start animation loop
      sceneManager.startAnimation();
      console.log('AR scene initialized and animation started');

      // Handle window resize
      const handleResize = () => {
        if (!isDestroyedRef.current && sceneManager.isActive()) {
          sceneManager.handleResize();
        }
      };
      window.addEventListener('resize', handleResize);

      // Request device orientation permission if needed
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              console.log('Device orientation permission granted');
            } else {
              console.warn('Device orientation permission denied');
            }
          })
          .catch(console.error);
      }

      // Cleanup function
      return () => {
        console.log('Cleaning up AR View');
        isDestroyedRef.current = true;
        window.removeEventListener('resize', handleResize);

        // Cleanup effects
        effectsRef.current.forEach((effect) => effect.destroy());
        effectsRef.current.clear();

        // Cleanup scene manager
        if (sceneManagerRef.current) {
          sceneManagerRef.current.cleanup();
          sceneManagerRef.current = undefined;
        }

        // Clear hit detector
        hitDetectorRef.current = undefined;
      };
    } catch (error) {
      console.error('Failed to initialize AR scene:', error);
      throw error;
    }
  }, []);

  // Create debug sphere to verify rendering
  useEffect(() => {
    if (sceneManagerRef.current?.isActive()) {
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(0, 1.6, -3); // Position in front of camera
      sceneManagerRef.current.getScene().add(sphere);
      console.log('Debug sphere added to scene');

      return () => {
        if (sceneManagerRef.current?.isActive()) {
          sceneManagerRef.current.getScene().remove(sphere);
          geometry.dispose();
          material.dispose();
        }
      };
    }
  }, []);

  // Rest of the component implementation...
  // (Keep the existing handleShoot, createSmokeEffect, and render methods)

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

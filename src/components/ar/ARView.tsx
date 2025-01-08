import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { DeviceOrientationControls } from 'three-stdlib';
import { useLocationContext } from '../../context/LocationContext';
import { DroneData } from '../../types/drone';
import { GeoObject } from '../../types/game';
import ARDroneModel from './ARDroneModel';
import GeoObjectNode from './GeoObjectNode';
import { geoObjectManager } from '../../services/GeoObjectManager';
import { calculateDistance } from '../../utils/maths';

const MAX_GEOOBJECT_DISTANCE = 25; // Maximum distance in meters

interface ARViewProps {
  drones?: DroneData[];
  geoObjects?: GeoObject[];
  onDroneShoot?: (droneId: string) => void;
  onGeoObjectHit?: (geoObjectId: string) => void;
}

const ARView: React.FC<ARViewProps> = ({
  drones = [],
  geoObjects = [],
  onDroneShoot,
  onGeoObjectHit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<DeviceOrientationControls>();
  const animationFrameIdRef = useRef<number>();
  const { location, heading } = useLocationContext();
  const geoObjectRefs = useRef<Map<string, THREE.Object3D>>(new Map());

  // Filter GeoObjects based on initial distance
  const visibleGeoObjects = useMemo(() => {
    if (!location) return [];

    return geoObjects.filter((geoObject) => {
      const distance = calculateDistance(location, geoObject.coordinate);
      console.log(`Distance to ${geoObject.id}: ${distance}m`);
      return distance <= MAX_GEOOBJECT_DISTANCE;
    });
  }, [geoObjects, location]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    camera.position.set(0, 1.6, 0);
    camera.rotation.set(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    controlsRef.current = new DeviceOrientationControls(camera);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    geoObjectManager.initialize(scene);
    geoObjectManager.setUpdateCallback((count) => {
      console.log('GeoObject count updated:', count);
    });
    geoObjectManager.setHitCallback((geoObject) => {
      onGeoObjectHit?.(geoObject.id);
    });

    // Animation loop with distance check
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Update visibility of all GeoObjects based on current distance
      if (location) {
        geoObjects.forEach((geoObject) => {
          const object = geoObjectRefs.current.get(geoObject.id);
          if (object) {
            const distance = calculateDistance(location, geoObject.coordinate);
            object.visible = distance <= MAX_GEOOBJECT_DISTANCE;
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      controlsRef.current?.disconnect();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geoObjectRefs.current.clear();
    };
  }, [geoObjects, location]);

  // Handle location updates for GeoObjects
  useEffect(() => {
    if (location) {
      geoObjectManager.updatePositions(location, heading || 0);
    }
  }, [location, heading]);

  // Register GeoObject refs for visibility tracking
  const handleGeoObjectMounted = useCallback(
    (id: string, object: THREE.Object3D) => {
      geoObjectRefs.current.set(id, object);
      return () => {
        geoObjectRefs.current.delete(id);
      };
    },
    []
  );

  return (
    <div ref={containerRef} className="absolute inset-0">
      {sceneRef.current && (
        <>
          {drones.map((drone) => (
            <ARDroneModel
              key={drone.droneId}
              drone={drone}
              onHit={onDroneShoot}
              modelUrl="/models/drone_four_rotor_one.glb"
              scene={sceneRef.current}
              camera={cameraRef.current}
            />
          ))}
          {visibleGeoObjects.map((geoObject) => (
            <GeoObjectNode
              key={geoObject.id}
              geoObject={geoObject}
              onHit={onGeoObjectHit}
              scene={sceneRef.current}
              camera={cameraRef.current}
              onMounted={(object) =>
                handleGeoObjectMounted(geoObject.id, object)
              }
            />
          ))}
        </>
      )}
    </div>
  );
};

export default ARView;

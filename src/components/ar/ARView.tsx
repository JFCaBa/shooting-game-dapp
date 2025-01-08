import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { DeviceOrientationControls } from 'three-stdlib';
import { useLocationContext } from '../../context/LocationContext';
import { DroneData } from '../../types/drone';
import { GeoObject } from '../../types/game';
import ARDroneModel from './ARDroneModel';
import GeoObjectNode from './GeoObjectNode';
import { geoObjectManager } from '../../services/GeoObjectManager';

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

    // Set camera at eye level but moved back
    camera.position.set(0, 1.6, 0); // Moved back in Z to help with aiming angle
    camera.rotation.set(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup controls
    controlsRef.current = new DeviceOrientationControls(camera);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Initialize GeoObjectManager
    geoObjectManager.initialize(scene);
    geoObjectManager.setUpdateCallback((count) => {
      console.log('GeoObject count updated:', count);
    });
    geoObjectManager.setHitCallback((geoObject) => {
      onGeoObjectHit?.(geoObject.id);
    });

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
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
    };
  }, []);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  // MARK: - checkHit
  const checkHit = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) {
      console.log('Missing refs:', {
        scene: !!sceneRef.current,
        camera: !!cameraRef.current,
      });
      return;
    }

    const crosshair = new THREE.Vector2(0, 0.33);
    raycaster.setFromCamera(crosshair, cameraRef.current);

    // Debug ray visualization
    const rayHelper = new THREE.ArrowHelper(
      raycaster.ray.direction,
      cameraRef.current.position,
      50,
      0xff0000,
      2,
      1
    );
    sceneRef.current.add(rayHelper);

    // Detailed debug information
    console.log('Shoot debug:', {
      camera: {
        position: cameraRef.current.position,
        rotation: cameraRef.current.rotation,
      },
      ray: {
        origin: raycaster.ray.origin.clone(),
        direction: raycaster.ray.direction.clone(),
      },
      crosshair,
    });

    // Check both drones and GeoObjects
    const targetMeshes: THREE.Object3D[] = [];
    const seenIds = new Set<string>();

    sceneRef.current.traverse((object) => {
      // Check drones
      if (
        object instanceof THREE.Mesh &&
        object.name?.startsWith('BoundingBox_Drone_')
      ) {
        const droneId = object.userData.droneId;
        if (!seenIds.has(droneId)) {
          seenIds.add(droneId);
          targetMeshes.push(object);

          const droneWorldPos = object.getWorldPosition(new THREE.Vector3());
          const relativePos = droneWorldPos
            .clone()
            .sub(cameraRef.current.position);
          console.log('Drone position:', {
            droneId,
            worldPosition: droneWorldPos,
            relativeToCamera: relativePos,
            distance: relativePos.length(),
          });
        }
      }

      // Check GeoObjects
      if (object instanceof THREE.Mesh && object.name?.startsWith('HitBox_')) {
        const geoObjectId = object.userData.geoObjectId;
        if (!seenIds.has(geoObjectId)) {
          seenIds.add(geoObjectId);
          targetMeshes.push(object);
        }
      }
    });

    // Process hits
    const intersects = raycaster.intersectObjects(targetMeshes);
    if (intersects.length > 0) {
      let hitObject = intersects[0].object;

      if (hitObject.name?.startsWith('BoundingBox_Drone_')) {
        while (hitObject.parent && !hitObject.userData.isMainDroneModel) {
          hitObject = hitObject.parent;
        }
        const droneId = hitObject.userData.droneId;
        if (droneId) {
          console.log('Hit confirmed on drone:', droneId);
          pullDownDrone(hitObject as THREE.Group);
          onDroneShoot?.(droneId);
        }
      } else if (hitObject.name?.startsWith('HitBox_')) {
        const geoObjectId = hitObject.userData.geoObjectId;
        if (geoObjectId) {
          console.log('Hit confirmed on GeoObject:', geoObjectId);
          geoObjectManager.handleHit(geoObjectId);
        }
      }
    }

    setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.remove(rayHelper);
      }
    }, 1000);
  }, [raycaster, onDroneShoot]);

  // MARK: - Smoke effect
  const createSmokeEffect = (position: THREE.Vector3) => {
    const smokeGeometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 50; i++) {
      vertices.push(
        position.x + Math.random() * 2 - 1,
        position.y + Math.random() * 2,
        position.z + Math.random() * 2 - 1
      );
    }
    smokeGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const smokeMaterial = new THREE.PointsMaterial({
      color: 0xff0000,
      size: 1,
      transparent: true,
      opacity: 0.5,
    });

    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push(
        position.x + Math.random() * 2 - 1,
        position.y + Math.random() * 2,
        position.z + Math.random() * 2 - 1
      );
    }
    smokeGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(particles, 3)
    );

    const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
    sceneRef.current.add(smoke);

    const animateSmoke = () => {
      const positions = smokeGeometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, positions.getY(i) + 0.05);
        positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.1);
        positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.1);
      }
      positions.needsUpdate = true;

      smokeMaterial.opacity -= 0.01;
      if (smokeMaterial.opacity <= 0) {
        sceneRef.current.remove(smoke);
      } else {
        requestAnimationFrame(animateSmoke);
      }
    };

    animateSmoke();
  };

  // MARK: - pullDownDrone
  const pullDownDrone = (drone: THREE.Group) => {
    const originalPosition = drone.position.clone();
    const targetPosition = new THREE.Vector3(
      originalPosition.x + 5,
      originalPosition.y - 5,
      originalPosition.z - 5
    );

    const duration = 1;
    const startTime = performance.now();

    createSmokeEffect(drone.position);

    const animateDownward = () => {
      const elapsedTime = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsedTime / duration, 1);

      drone.position.lerpVectors(originalPosition, targetPosition, progress);

      if (progress < 1) {
        requestAnimationFrame(animateDownward);
      } else {
        sceneRef.current.remove(drone);
        const audio = new Audio('/assets/explosion_sound.wav');
        audio.play();
      }
    };

    animateDownward();
  };

  // Handle location updates for GeoObjects
  useEffect(() => {
    if (location) {
      geoObjectManager.updatePositions(location, heading || 0);
    }
  }, [location, heading]);

  // Spawn GeoObjects
  useEffect(() => {
    geoObjects.forEach((geoObject) => {
      geoObjectManager.spawnGeoObject(geoObject, location);
    });
  }, [geoObjects]);

  // Listen for gameShoot events
  useEffect(() => {
    console.log('ARView mounted, setting up gameShoot listener');

    const handleShoot = () => {
      console.log('ARView: gameShoot event received');
      checkHit();
    };

    document.addEventListener('gameShoot', handleShoot);

    return () => {
      console.log('ARView unmounting, removing gameShoot listener');
      document.removeEventListener('gameShoot', handleShoot);
    };
  }, [checkHit]);

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
          {geoObjects.map((geoObject) => (
            <GeoObjectNode
              key={geoObject.id}
              geoObject={geoObject}
              onHit={onGeoObjectHit}
              scene={sceneRef.current}
              camera={cameraRef.current}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default ARView;

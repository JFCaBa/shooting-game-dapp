import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { DeviceOrientationControls } from 'three-stdlib';
import { useLocationContext } from '../../context/LocationContext';
import { DroneData } from '../../types/drone';
import ARDroneModel from './ARDroneModel';

const RAY_LENGTH = 5; // Adjust based on your scene size

interface ARViewProps {
  drones?: DroneData[];
  onDroneShoot?: (droneId: string) => void;
}

const ARView: React.FC<ARViewProps> = ({ drones = [], onDroneShoot }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<DeviceOrientationControls>();
  const animationFrameIdRef = useRef<number>();
  const { heading } = useLocationContext();

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Three.js
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0);
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

    // Cleanup
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

  const checkHit = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) {
      console.log('Missing refs:', {
        scene: !!sceneRef.current,
        camera: !!cameraRef.current,
      });
      return;
    }

    // Use fixed crosshair position
    const crosshair = new THREE.Vector2(0, 0.33);
    console.log('Crosshair position:', crosshair);

    // Update raycaster
    raycaster.setFromCamera(crosshair, cameraRef.current);
    console.log('Raycaster:', {
      origin: raycaster.ray.origin,
      direction: raycaster.ray.direction,
    });

    // Debug ray visualization
    const rayHelper = new THREE.ArrowHelper(
      raycaster.ray.direction,
      raycaster.ray.origin,
      20, // Increased length for better visibility
      0xffff00,
      1,
      0.5
    );
    sceneRef.current.add(rayHelper);
    console.log('Added ray helper to scene');

    // Get all meshes with bounding boxes
    const targetMeshes: THREE.Object3D[] = [];
    const seenDroneIds = new Set<string>(); // Track seen drone IDs

    sceneRef.current.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.name?.startsWith('BoundingBox_Drone_')
      ) {
        const droneId = object.userData.droneId;
        if (!seenDroneIds.has(droneId)) {
          seenDroneIds.add(droneId);
          console.log('Processing bounding box:', {
            name: object.name,
            position: object.position,
            worldPosition: object.getWorldPosition(new THREE.Vector3()),
            scale: object.scale,
            matrix: object.matrix,
          });
          targetMeshes.push(object);
        }
      }
    });

    console.log('Total unique target meshes found:', targetMeshes.length);

    // Check intersections with original meshes (no cloning)
    const intersects = raycaster.intersectObjects(targetMeshes, false);
    console.log('Intersection results:', intersects);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const droneId = hitObject.userData.droneId;
      if (droneId) {
        console.log('Hit confirmed on drone:', droneId);
        onDroneShoot?.(droneId);
      }
    } else {
      console.log('No intersections found');
    }

    // Remove ray helper after delay
    setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.remove(rayHelper);
        console.log('Removed ray helper');
      }
    }, 1000);
  }, [raycaster, onDroneShoot]);

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
      {sceneRef.current &&
        drones.map((drone) => (
          <ARDroneModel
            key={drone.droneId}
            drone={drone}
            onHit={onDroneShoot}
            modelUrl="/models/drone.glb"
            scene={sceneRef.current}
            camera={cameraRef.current}
          />
        ))}
    </div>
  );
};

export default ARView;

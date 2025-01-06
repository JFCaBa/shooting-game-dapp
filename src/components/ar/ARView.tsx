import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { DeviceOrientationControls } from 'three-stdlib';
import { useLocationContext } from '../../context/LocationContext';
import { DroneData } from '../../types/drone';
import ARDroneModel from './ARDroneModel';

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

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50, // Narrower FOV to help with aiming
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Set camera at eye level but moved back
    camera.position.set(0, 1.6, 2); // Moved back in Z to help with aiming angle

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

  // MARK: - checkHit

  const checkHit = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) {
      console.log('Missing refs:', {
        scene: !!sceneRef.current,
        camera: !!cameraRef.current,
      });
      return;
    }

    // We know camera is at (0, 1.6, 0)
    const crosshair = new THREE.Vector2(0, 0.33); // Adjusted to aim more horizontally from eye level

    // Update raycaster from camera position
    raycaster.setFromCamera(crosshair, cameraRef.current);

    // Debug ray visualization - with proper origin and longer range
    const rayHelper = new THREE.ArrowHelper(
      raycaster.ray.direction,
      cameraRef.current.position, // Start from actual camera position
      50, // Long enough to see intersection with drones
      0xff0000,
      2, // Bigger arrow head
      1 // Bigger arrow head width
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

    // Get all meshes with bounding boxes
    const targetMeshes: THREE.Object3D[] = [];
    const seenDroneIds = new Set<string>();

    sceneRef.current.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.name?.startsWith('BoundingBox_Drone_')
      ) {
        const droneId = object.userData.droneId;
        if (!seenDroneIds.has(droneId)) {
          seenDroneIds.add(droneId);
          targetMeshes.push(object);

          // Log each drone's position relative to camera
          const droneWorldPos = object.getWorldPosition(new THREE.Vector3());
          const relativePos = droneWorldPos
            .clone()
            .sub(cameraRef.current.position);

          // Detailed position log for debugging
          console.log('Drone position:', {
            droneId,
            worldPosition: droneWorldPos,
            relativeToCamera: relativePos,
            distance: relativePos.length(),
          });

          // Optional: Here you can add your hit detection logic if needed
          // For example, if the ray intersects the drone, you can handle it like so:
          // Intersection check
          const intersects = raycaster.intersectObject(object);
          if (intersects.length > 0) {
            let hitObject = intersects[0].object;

            // Traverse up to find main drone model
            while (hitObject.parent && !hitObject.userData.isMainDroneModel) {
              hitObject = hitObject.parent;
            }

            const droneId = hitObject.userData.droneId;
            if (droneId) {
              console.log(
                'Hit confirmed on drone:',
                droneId,
                'at distance:',
                intersects[0].distance
              );

              // Pass the main drone model
              pullDownDrone(hitObject as THREE.Group);
              onDroneShoot?.(droneId);
            }
          }
        }
      }
    });

    // Remove ray helper after delay
    setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.remove(rayHelper);
      }
    }, 1000); // Longer display time for better visualization
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
      color: 0xff0000, // Smoke color
      size: 1, // Size of smoke particles
      transparent: true,
      opacity: 0.5, // Initial opacity
    });

    // Generate particles
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push(
        position.x + Math.random() * 2 - 1, // Random offset
        position.y + Math.random() * 2, // Start above the hit point
        position.z + Math.random() * 2 - 1 // Random offset
      );
    }
    smokeGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(particles, 3)
    );

    const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
    sceneRef.current.add(smoke);

    // Animate particles (move upward and fade out)
    const animateSmoke = () => {
      const positions = smokeGeometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, positions.getY(i) + 0.05); // Move particles up
        positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.1); // Add some random horizontal movement
        positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.1);
      }
      positions.needsUpdate = true;

      smokeMaterial.opacity -= 0.01; // Gradually fade out
      if (smokeMaterial.opacity <= 0) {
        sceneRef.current.remove(smoke); // Remove smoke after it fades
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
      originalPosition.x,
      originalPosition.y - 5,
      originalPosition.z
    ); // Adjust '5' for how far to pull the drone down

    const duration = 2; // Duration of the pull down in seconds
    const startTime = performance.now();

    // Start smoke effect once drone starts moving
    createSmokeEffect(drone.position);

    const animateDownward = () => {
      const elapsedTime = (performance.now() - startTime) / 1000; // Time in seconds
      const progress = Math.min(elapsedTime / duration, 1); // Progress of animation (0 to 1)

      drone.position.lerpVectors(originalPosition, targetPosition, progress); // Linearly interpolate the position

      if (progress < 1) {
        requestAnimationFrame(animateDownward); // Keep animating until the drone reaches the target position
      } else {
        // Once drone reaches target position, remove it from the scene
        sceneRef.current.remove(drone);

        // Play explosion sound
        const audio = new Audio('/assets/explosion_sound.wav');
        audio.play();
      }
    };

    animateDownward();
  };

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

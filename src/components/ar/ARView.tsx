import React, { useEffect, useRef } from 'react';
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

  // Update camera rotation based on device heading
  useEffect(() => {
    if (heading !== null && cameraRef.current) {
      cameraRef.current.rotation.y = THREE.MathUtils.degToRad(-heading);
    }
  }, [heading]);

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
          />
        ))}
    </div>
  );
};

export default ARView;

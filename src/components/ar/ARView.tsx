import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLocationContext } from '../../context/LocationContext';
import { Player } from '../../types/game';
import { DroneData } from '../../types/drone';
import ARDroneModel from './ARDroneModel';

interface ARViewProps {
  players: Player[];
  drones?: DroneData[];
  onDroneShoot?: (droneId: string) => void;
}

const ARView: React.FC<ARViewProps> = ({
  players,
  drones = [],
  onDroneShoot,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
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
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup
    // return () => {
    //   if (containerRef.current && rendererRef.current) {
    //     containerRef.current.removeChild(rendererRef.current.domElement);
    //   }
    // };
  }, []);

  // Update camera rotation based on device heading
  useEffect(() => {
    if (heading !== null && cameraRef.current) {
      cameraRef.current.rotation.y = THREE.MathUtils.degToRad(-heading);
    }
  }, [heading]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {/* Render drones */}
      {drones.map((drone) => (
        <ARDroneModel
          key={drone.droneId}
          drone={drone}
          onHit={onDroneShoot}
          modelUrl="/models/drone.glb"
        />
      ))}

      {/* Debug overlay */}
      {/* <div className="absolute top-20 right-4 bg-black bg-opacity-50 p-2 text-white text-sm">
        <div>Players: {players.length}</div>
        <div>Drones: {drones.length}</div>
        <div>Heading: {heading?.toFixed(1)}°</div>
        <div>
          Location:{' '}
          {location
            ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(
                6
              )}`
            : 'No location'}
        </div>
      </div> */}
    </div>
  );
};

export default ARView;

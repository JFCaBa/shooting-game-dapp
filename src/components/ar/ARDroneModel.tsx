import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DroneData, convertToVector3 } from '../../types/drone';
import { DeviceOrientationControls } from 'three-stdlib';

interface ARDroneModelProps {
  drone: DroneData;
  onHit?: (droneId: string) => void;
  modelUrl: string;
}

const ARDroneModel: React.FC<ARDroneModelProps> = ({
  drone,
  onHit,
  modelUrl,
}) => {
  const modelRef = useRef<THREE.Group>();
  const isDestroyedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clock = useRef<THREE.Clock>(new THREE.Clock());
  const controlsRef = useRef<DeviceOrientationControls>();

  // Move mixers to useMemo
  const mixers = useMemo(() => [] as THREE.AnimationMixer[], []);

  const startAnimations = useCallback(() => {
    if (!modelRef.current) return;

    const hoverAnimation = new THREE.AnimationMixer(modelRef.current);
    mixers.push(hoverAnimation);

    const hoverClip = new THREE.AnimationClip('hover', 2, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 1, 2],
        [drone.position.y, drone.position.y + 0.1, drone.position.y]
      ),
    ]);

    const circularRotationClip = new THREE.AnimationClip(
      'circularRotation',
      5,
      [
        new THREE.VectorKeyframeTrack(
          '.position[x]',
          [0, 1, 2, 3, 4, 5],
          [
            drone.position.x,
            drone.position.x + Math.cos(0) * 2,
            drone.position.x + Math.cos(Math.PI / 2) * 2,
            drone.position.x + Math.cos(Math.PI) * 2,
            drone.position.x + Math.cos((3 * Math.PI) / 2) * 2,
            drone.position.x + Math.cos(2 * Math.PI) * 2,
          ]
        ),
        new THREE.VectorKeyframeTrack(
          '.position[z]',
          [0, 1, 2, 3, 4, 5],
          [
            drone.position.z,
            drone.position.z + Math.sin(0) * 2,
            drone.position.z + Math.sin(Math.PI / 2) * 2,
            drone.position.z + Math.sin(Math.PI) * 2,
            drone.position.z + Math.sin((3 * Math.PI) / 2) * 2,
            drone.position.z + Math.sin(2 * Math.PI) * 2,
          ]
        ),
      ]
    );

    hoverAnimation.clipAction(hoverClip).play();
    hoverAnimation.clipAction(circularRotationClip).play();
  }, [drone.position, mixers]);

  const stopAnimations = useCallback(() => {
    mixers.forEach((mixer) => mixer.stopAllAction());
    mixers.length = 0;
  }, [mixers]);

  const handleHit = useCallback(() => {
    if (isDestroyedRef.current || !modelRef.current) return false;
    isDestroyedRef.current = true;

    stopAnimations();

    const fallAnimation = new THREE.AnimationMixer(modelRef.current);
    mixers.push(fallAnimation);
    const fallClip = new THREE.AnimationClip('fall', 1.5, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 1.5],
        [modelRef.current.position.y, -1]
      ),
      new THREE.VectorKeyframeTrack(
        '.rotation',
        [0, 1.5],
        [0, 0, 0, Math.PI / 2, Math.PI / 2, Math.PI / 2]
      ),
    ]);

    fallAnimation.clipAction(fallClip).play();
    onHit?.(drone.droneId);

    return true;
  }, [mixers, stopAnimations, drone.droneId, onHit]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    controlsRef.current = new DeviceOrientationControls(camera);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        modelRef.current = gltf.scene;
        const dronePosition = convertToVector3(drone.position);
        modelRef.current.position.copy(dronePosition);
        scene.add(modelRef.current);
        startAnimations();
      },
      undefined,
      (error) => console.error('Error loading drone model:', error)
    );

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.current.getDelta();
      mixers.forEach((mixer) => mixer.update(delta));
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();
  }, [drone.position, modelUrl, startAnimations, mixers, handleHit]);

  return <div ref={containerRef} />;
};

export default ARDroneModel;

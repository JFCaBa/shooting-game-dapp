import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRONE_SCALE, DroneData, convertToVector3 } from '../../types/drone';

interface ARDroneModelProps {
  drone: DroneData;
  onHit?: (droneId: string) => void;
  modelUrl: string;
  scene: THREE.Scene;
}

const ARDroneModel: React.FC<ARDroneModelProps> = ({
  drone,
  onHit,
  modelUrl,
  scene,
}) => {
  const modelRef = useRef<THREE.Group>();
  const isDestroyedRef = useRef(false);
  const mixers = useMemo(() => [] as THREE.AnimationMixer[], []);
  const clock = useRef(new THREE.Clock());

  const startAnimations = useCallback(() => {
    if (!modelRef.current) return;

    const mixer = new THREE.AnimationMixer(modelRef.current);
    mixers.push(mixer);

    // Initial position from the drone model
    const initialPosition = modelRef.current.position.clone();

    // Hover animation
    const hoverTimeline = [0, 0.5, 1]; // Normalized time points
    const hoverHeights = [
      initialPosition.y,
      initialPosition.y + 0.2,
      initialPosition.y,
    ];

    const hoverClip = new THREE.AnimationClip('hover', 2, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        hoverTimeline,
        hoverHeights
      ),
    ]);

    // Circular motion
    const loopDuration = 10; // seconds per loop
    const points = 30;
    const radius = 5;
    const centerPoint = new THREE.Vector3(0, initialPosition.y, 0);

    const times = new Float32Array(points + 1);
    const xPositions = new Float32Array(points + 1);
    const zPositions = new Float32Array(points + 1);

    for (let i = 0; i <= points; i++) {
      times[i] = (i / points) * loopDuration;
      const angle = (i / points) * Math.PI * 2;
      xPositions[i] = centerPoint.x + Math.cos(angle) * radius;
      zPositions[i] = centerPoint.z + Math.sin(angle) * radius;
    }

    const circularClip = new THREE.AnimationClip('circular', loopDuration, [
      new THREE.KeyframeTrack('.position[x]', times, xPositions),
      new THREE.KeyframeTrack('.position[z]', times, zPositions),
    ]);

    // Play animations
    const hoverAction = mixer.clipAction(hoverClip);
    const circularAction = mixer.clipAction(circularClip);

    hoverAction.setLoop(THREE.LoopPingPong, Infinity);
    circularAction.setLoop(THREE.LoopRepeat, Infinity);

    hoverAction.play();
    circularAction.play();
  }, [mixers]);

  const handleHit = useCallback(() => {
    if (isDestroyedRef.current || !modelRef.current) return false;
    isDestroyedRef.current = true;

    const fallAnimation = new THREE.AnimationMixer(modelRef.current);
    mixers.push(fallAnimation);
    const fallClip = new THREE.AnimationClip('fall', 1.5, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 1.5],
        [modelRef.current.position.y, -5]
      ),
      new THREE.VectorKeyframeTrack(
        '.rotation',
        [0, 1.5],
        [
          0,
          0,
          0,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ]
      ),
    ]);

    const fallAction = fallAnimation.clipAction(fallClip);
    fallAction.setLoop(THREE.LoopOnce, 1);
    fallAction.clampWhenFinished = true;
    fallAction.play();

    setTimeout(() => {
      onHit?.(drone.droneId);
      scene.remove(modelRef.current!);
    }, 1500);

    return true;
  }, [drone.droneId, onHit, scene]);

  // Load model and start animations
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.scale.copy(DRONE_SCALE);

        // Calculate position relative to camera
        const droneWorldPos = convertToVector3(drone.position);
        const position = new THREE.Vector3(
          droneWorldPos.x,
          4, // meters above eye level
          droneWorldPos.z
        );

        model.position.copy(position);
        modelRef.current = model;
        scene.add(model);
        startAnimations();
      },
      undefined,
      (error) => console.error('Error loading drone model:', error)
    );

    // Animation update loop
    const frameId = requestAnimationFrame(function update() {
      mixers.forEach((mixer) => mixer.update(clock.current.getDelta()));
      requestAnimationFrame(update);
    });

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      mixers.forEach((mixer) => mixer.stopAllAction());
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }
    };
  }, [scene, modelUrl, drone.position, startAnimations, mixers]);

  return null; // This component only manages the 3D model
};

export default ARDroneModel;

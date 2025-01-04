import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRONE_SCALE, DroneData, convertToVector3 } from '../../types/drone';

interface ARDroneModelProps {
  drone: DroneData;
  onHit?: (droneId: string) => void;
  modelUrl: string;
  scene: THREE.Scene; // Pass the scene from parent
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

  // MARK: - Animations
  const startAnimations = useCallback(() => {
    if (!modelRef.current) return;

    const hoverAnimation = new THREE.AnimationMixer(modelRef.current);
    mixers.push(hoverAnimation);

    const initialPosition = modelRef.current.position.clone();
    const radius = 5;
    const loopDuration = 30;
    const points = 60;
    const centerPoint = new THREE.Vector3(0, initialPosition.y, 0);

    const keyTimes = Array.from(
      { length: points + 1 },
      (_, i) => (i / points) * loopDuration
    );

    const xPositions = Array.from(
      { length: points + 1 },
      (_, i) => centerPoint.x + Math.cos((i * 2 * Math.PI) / points) * radius
    );

    const zPositions = Array.from(
      { length: points + 1 },
      (_, i) => centerPoint.z + Math.sin((i * 2 * Math.PI) / points) * radius
    );

    const hoverClip = new THREE.AnimationClip('hover', 4, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 2, 4],
        [initialPosition.y, initialPosition.y + 0.2, initialPosition.y]
      ),
    ]);

    const circularClip = new THREE.AnimationClip('circular', loopDuration, [
      new THREE.VectorKeyframeTrack('.position[x]', keyTimes, xPositions),
      new THREE.VectorKeyframeTrack('.position[z]', keyTimes, zPositions),
    ]);

    const hoverAction = hoverAnimation.clipAction(hoverClip);
    const circularAction = hoverAnimation.clipAction(circularClip);

    hoverAction.setLoop(THREE.LoopPingPong, Infinity);
    circularAction.setLoop(THREE.LoopRepeat, Infinity);

    hoverAction.play();
    circularAction.play();
  }, [mixers]);

  // MARK: - Handle Hit
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
      // Remove the drone from the scene after animation
      scene.remove(modelRef.current!);
    }, 1500);

    return true;
  }, [drone.droneId, onHit, scene]);

  // MARK: - Load Model
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
          2, // 2 meters above eye level
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

    // Cleanup
    return () => {
      mixers.forEach((mixer) => mixer.stopAllAction());
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }
    };
  }, [scene, modelUrl, drone.position, startAnimations, mixers]);

  // MARK: - Animation Update
  useEffect(() => {
    const animate = (deltaTime: number) => {
      mixers.forEach((mixer) => mixer.update(deltaTime));
    };

    const clock = new THREE.Clock();
    const frameId = requestAnimationFrame(function update() {
      animate(clock.getDelta());
      requestAnimationFrame(update);
    });

    return () => cancelAnimationFrame(frameId);
  }, [mixers]);

  // No need to render anything - we're just managing the 3D model
  return null;
};

export default ARDroneModel;

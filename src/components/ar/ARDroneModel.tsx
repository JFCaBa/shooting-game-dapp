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

  const initializeRotorAnimation = useCallback((rotor: THREE.Object3D) => {
    // Calculate the rotor's geometry center
    const box = new THREE.Box3().setFromObject(rotor);
    const center = box.getCenter(new THREE.Vector3());

    // Create a pivot point at the rotor's center
    const pivot = new THREE.Object3D();
    pivot.position.copy(center);
    rotor.parent?.add(pivot);

    // Move the rotor to the pivot
    rotor.position.sub(center);
    pivot.add(rotor);

    // Create animation mixer for the pivot
    const rotorMixer = new THREE.AnimationMixer(pivot);
    mixers.push(rotorMixer);

    // Create rotation animation
    const rotationTrack = new THREE.KeyframeTrack(
      '.rotation[y]',
      [0, 0.3], // Duration of 0.5 seconds
      [0, Math.PI * 2] // Full rotation
    );

    const rotationClip = new THREE.AnimationClip(
      `rotor_spin_${rotor.name}`,
      0.3,
      [rotationTrack]
    );

    const action = rotorMixer.clipAction(rotationClip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
  }, []);

  // Start all animations including rotors and movement
  const startAnimations = useCallback(() => {
    if (!modelRef.current) return;

    // Find and animate all rotors
    const rotorNames = ['Rotor_F_R', 'Rotor_F_L', 'Rotor_R_R', 'Rotor_R_L'];
    modelRef.current.traverse((child) => {
      if (rotorNames.includes(child.name)) {
        initializeRotorAnimation(child);
      }
    });

    // Create main model mixer for hover and movement
    const mainMixer = new THREE.AnimationMixer(modelRef.current);
    mixers.push(mainMixer);

    // Initial position
    const initialPosition = modelRef.current.position.clone();

    // Hover animation
    const hoverDuration = 2;
    const hoverHeight = 0.3;
    const hoverTrack = new THREE.VectorKeyframeTrack(
      '.position[y]',
      [0, hoverDuration / 2, hoverDuration],
      [initialPosition.y, initialPosition.y + hoverHeight, initialPosition.y]
    );

    const hoverClip = new THREE.AnimationClip('hover', hoverDuration, [
      hoverTrack,
    ]);
    const hoverAction = mainMixer.clipAction(hoverClip);
    hoverAction.setLoop(THREE.LoopPingPong, Infinity);
    hoverAction.play();

    // Patrol movement animation (circular pattern)
    const patrolDuration = 8;
    const patrolRadius = 5;
    const patrolPoints = 30;
    const times = new Float32Array(patrolPoints + 1);
    const xPositions = new Float32Array(patrolPoints + 1);
    const zPositions = new Float32Array(patrolPoints + 1);

    for (let i = 0; i <= patrolPoints; i++) {
      times[i] = (i / patrolPoints) * patrolDuration;
      const angle = (i / patrolPoints) * Math.PI * 2;
      xPositions[i] = initialPosition.x + Math.cos(angle) * patrolRadius;
      zPositions[i] = initialPosition.z + Math.sin(angle) * patrolRadius;
    }

    const patrolClip = new THREE.AnimationClip('patrol', patrolDuration, [
      new THREE.KeyframeTrack('.position[x]', times, xPositions),
      new THREE.KeyframeTrack('.position[z]', times, zPositions),
    ]);

    const patrolAction = mainMixer.clipAction(patrolClip);
    patrolAction.setLoop(THREE.LoopRepeat, Infinity);
    patrolAction.play();
  }, [mixers, initializeRotorAnimation]);

  const handleHit = useCallback(() => {
    if (isDestroyedRef.current || !modelRef.current) return false;
    isDestroyedRef.current = true;

    // Stop all current animations
    mixers.forEach((mixer) => mixer.stopAllAction());

    // Create falling animation
    const fallMixer = new THREE.AnimationMixer(modelRef.current);
    mixers.push(fallMixer);

    const fallDuration = 1.5;
    const fallDistance = -5;
    const rotationAmount = Math.PI * 4; // Two full rotations

    const fallClip = new THREE.AnimationClip('fall', fallDuration, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, fallDuration],
        [modelRef.current.position.y, fallDistance]
      ),
      new THREE.VectorKeyframeTrack(
        '.rotation[x]',
        [0, fallDuration],
        [0, rotationAmount * (Math.random() - 0.5)]
      ),
      new THREE.VectorKeyframeTrack(
        '.rotation[z]',
        [0, fallDuration],
        [0, rotationAmount * (Math.random() - 0.5)]
      ),
    ]);

    const fallAction = fallMixer.clipAction(fallClip);
    fallAction.setLoop(THREE.LoopOnce, 1);
    fallAction.clampWhenFinished = true;
    fallAction.play();

    // Remove the drone after animation completes
    setTimeout(() => {
      onHit?.(drone.droneId);
      scene.remove(modelRef.current!);
    }, fallDuration * 1000);

    return true;
  }, [drone.droneId, mixers, onHit, scene]);

  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.scale.copy(DRONE_SCALE);

        // Add droneId to userData for hit detection
        model.userData.droneId = drone.droneId;

        // Also add to all children for easier hit detection
        model.traverse((child) => {
          child.userData.droneId = drone.droneId;
        });

        // Position the drone relative to the camera
        const droneWorldPos = convertToVector3(drone.position);
        const position = new THREE.Vector3(
          droneWorldPos.x,
          4, // Height above ground
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

    // Animation loop
    const animate = () => {
      const delta = clock.current.getDelta();
      mixers.forEach((mixer) => mixer.update(delta));
      return requestAnimationFrame(animate);
    };
    const animationId = animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      mixers.forEach((mixer) => mixer.stopAllAction());
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }
    };
  }, [scene, modelUrl, drone.position, startAnimations, mixers]);

  return null;
};

export default ARDroneModel;

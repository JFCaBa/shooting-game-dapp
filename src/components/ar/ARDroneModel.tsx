import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRONE_SCALE, DroneData, convertToVector3 } from '../../types/drone';
import { disposeMaterial, disposeGeometry } from '../../utils/three-utils';

interface ARDroneModelProps {
  drone: DroneData;
  onHit?: (droneId: string) => void;
  modelUrl: string;
  scene: THREE.Scene;
  camera: THREE.Camera;
}

const ARDroneModel: React.FC<ARDroneModelProps> = ({
  drone,
  modelUrl,
  scene,
  camera,
}) => {
  const modelRef = useRef<THREE.Group | null>(null);
  const mixersRef = useRef<THREE.AnimationMixer[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const isDestroyedRef = useRef(false);

  // Clean up all resources
  const cleanup = useCallback(() => {
    isDestroyedRef.current = true;

    // Cancel animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop and dispose mixers
    mixersRef.current.forEach((mixer) => {
      mixer.stopAllAction();
      mixer.uncacheRoot(mixer.getRoot());
    });
    mixersRef.current = [];

    // Clean up model and its resources
    if (modelRef.current) {
      modelRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            disposeGeometry(object.geometry);
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => disposeMaterial(material));
            } else {
              disposeMaterial(object.material);
            }
          }
        }
      });
      scene.remove(modelRef.current);
      modelRef.current = null;
    }

    // Reset clock
    clockRef.current = new THREE.Clock();
  }, [scene]);

  // Animation loop
  const animate = useCallback(() => {
    if (isDestroyedRef.current) return;

    const delta = clockRef.current.getDelta();
    mixersRef.current.forEach((mixer) => mixer.update(delta));
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Initialize rotor animation
  const initializeRotorAnimation = useCallback((rotor: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(rotor);
    const center = box.getCenter(new THREE.Vector3());

    const pivot = new THREE.Object3D();
    pivot.position.copy(center);
    rotor.parent?.add(pivot);

    rotor.position.sub(center);
    pivot.add(rotor);

    const rotorMixer = new THREE.AnimationMixer(pivot);
    mixersRef.current.push(rotorMixer);

    const track = new THREE.KeyframeTrack(
      '.rotation[y]',
      [0, 0.3],
      [0, Math.PI * 2]
    );

    const clip = new THREE.AnimationClip(`rotor_spin_${rotor.name}`, 0.3, [
      track,
    ]);
    const action = rotorMixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
  }, []);

  // Initialize all animations
  const initializeAnimations = useCallback(() => {
    if (!modelRef.current) return;

    const eyeLevelOffset = 2;
    const initialPosition = modelRef.current.position.clone();
    initialPosition.y += eyeLevelOffset;

    // Initialize rotors
    const rotorNames = ['Rotor_F_R', 'Rotor_F_L', 'Rotor_R_R', 'Rotor_R_L'];
    modelRef.current.traverse((child) => {
      if (rotorNames.includes(child.name)) {
        initializeRotorAnimation(child);
      }
    });

    // Main drone animations
    const mainMixer = new THREE.AnimationMixer(modelRef.current);
    mixersRef.current.push(mainMixer);

    // Hover animation
    const hoverAnimation = createHoverAnimation(initialPosition);
    const hoverAction = mainMixer.clipAction(hoverAnimation);
    hoverAction.setLoop(THREE.LoopPingPong, Infinity);
    hoverAction.play();

    // Patrol animation
    const patrolAnimation = createPatrolAnimation(initialPosition);
    const patrolAction = mainMixer.clipAction(patrolAnimation);
    patrolAction.setLoop(THREE.LoopRepeat, Infinity);
    patrolAction.play();

    animate();
  }, [initializeRotorAnimation, animate]);

  // Create hover animation
  const createHoverAnimation = useCallback((initialPosition: THREE.Vector3) => {
    const hoverTrack = new THREE.VectorKeyframeTrack(
      '.position[y]',
      [0, 1, 2],
      [initialPosition.y, initialPosition.y + 1, initialPosition.y]
    );
    return new THREE.AnimationClip('hover', 2, [hoverTrack]);
  }, []);

  // Create patrol animation
  const createPatrolAnimation = useCallback(
    (initialPosition: THREE.Vector3) => {
      const patrolRadius = 8;
      const patrolDuration = 6;
      const points = Array.from({ length: 31 }, (_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        return {
          time: (i / 30) * patrolDuration,
          x: initialPosition.x + Math.cos(angle) * patrolRadius,
          z: initialPosition.z + Math.sin(angle) * patrolRadius,
        };
      });

      return new THREE.AnimationClip('patrol', patrolDuration, [
        new THREE.KeyframeTrack(
          '.position[x]',
          points.map((p) => p.time),
          points.map((p) => p.x)
        ),
        new THREE.KeyframeTrack(
          '.position[z]',
          points.map((p) => p.time),
          points.map((p) => p.z)
        ),
      ]);
    },
    []
  );

  // Create bounding box
  const createBoundingBox = useCallback((droneId: string) => {
    const geometry = new THREE.BoxGeometry(35, 15, 25);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.2,
      transparent: true,
      visible: false,
    });

    const boundingBox = new THREE.Mesh(geometry, material);
    boundingBox.name = `BoundingBox_Drone_${droneId}`;
    boundingBox.userData.droneId = droneId;
    return boundingBox;
  }, []);

  // Load model
  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        if (isDestroyedRef.current) return;

        const model = gltf.scene;
        const position = convertToVector3(drone.position);

        model.position.copy(position);
        model.scale.copy(DRONE_SCALE);
        model.userData.droneId = drone.droneId;
        model.userData.isMainDroneModel = true;

        model.traverse((child) => {
          child.userData.droneId = drone.droneId;
          if (child instanceof THREE.Mesh) {
            child.userData.isTargetable = true;
          }
        });

        const boundingBox = createBoundingBox(drone.droneId);
        model.add(boundingBox);

        modelRef.current = model;
        scene.add(model);
        initializeAnimations();
      },
      undefined,
      (error) => console.error('Error loading drone model:', error)
    );

    return cleanup;
  }, [
    scene,
    modelUrl,
    drone.droneId,
    drone.position,
    initializeAnimations,
    cleanup,
    createBoundingBox,
  ]);

  // Update position
  useEffect(() => {
    if (modelRef.current && !isDestroyedRef.current) {
      const position = convertToVector3(drone.position);
      modelRef.current.position.copy(position);
    }
  }, [drone.position]);

  return null;
};

export default ARDroneModel;

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRONE_SCALE, DroneData, convertToVector3 } from '../../types/drone';

interface ARDroneModelProps {
  drone: DroneData;
  onHit?: (droneId: string) => void;
  modelUrl: string;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cacheTexture?: (key: string, texture: THREE.Texture) => THREE.Texture;
  queueForDisposal?: (object: THREE.Object3D) => void;
}

const ARDroneModel: React.FC<ARDroneModelProps> = ({
  drone,
  onHit,
  modelUrl,
  scene,
  camera,
  cacheTexture,
  queueForDisposal,
}) => {
  const modelRef = useRef<THREE.Group>();
  const boundingBoxesRef = useRef(new Map());
  const isDestroyedRef = useRef(false);
  const mixers = useRef<THREE.AnimationMixer[]>([]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isDestroyedRef.current) return;
    isDestroyedRef.current = true;

    // Stop all animations
    mixers.current.forEach((mixer) => mixer.stopAllAction());
    mixers.current = [];

    // Queue model for disposal if memory management is enabled
    if (queueForDisposal && modelRef.current) {
      queueForDisposal(modelRef.current);
    }
  }, [queueForDisposal]);

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
    mixers.current.push(rotorMixer);

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

  // Load and setup model
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

        // Apply cached textures if available
        if (cacheTexture) {
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial;
              if (material.map) {
                material.map = cacheTexture(
                  `${drone.droneId}_${child.name}_map`,
                  material.map
                );
              }
            }
          });
        }

        // Bounding box setup
        const boundingBoxGeometry = new THREE.BoxGeometry(35, 15, 25);
        const boundingBoxMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          opacity: 0.2,
          transparent: true,
          visible: false,
        });

        const boundingBox = new THREE.Mesh(
          boundingBoxGeometry,
          boundingBoxMaterial
        );
        boundingBox.name = `BoundingBox_Drone_${drone.droneId}`;
        boundingBox.userData.droneId = drone.droneId;
        model.add(boundingBox);

        modelRef.current = model;
        scene.add(model);

        // Initialize rotor animations
        const rotorNames = ['Rotor_F_R', 'Rotor_F_L', 'Rotor_R_R', 'Rotor_R_L'];
        model.traverse((child) => {
          if (rotorNames.includes(child.name)) {
            initializeRotorAnimation(child);
          }
        });
      },
      undefined,
      (error) => console.error('Error loading drone model:', error)
    );

    return () => {
      cleanup();
    };
  }, [
    scene,
    modelUrl,
    drone.position,
    drone.droneId,
    initializeRotorAnimation,
    cleanup,
    cacheTexture,
  ]);

  // Update position when drone moves
  useEffect(() => {
    if (modelRef.current && !isDestroyedRef.current) {
      const position = convertToVector3(drone.position);
      modelRef.current.position.copy(position);
    }
  }, [drone.position]);

  return null;
};

export default ARDroneModel;

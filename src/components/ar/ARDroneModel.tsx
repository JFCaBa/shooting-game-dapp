import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRONE_SCALE, DroneData, convertToVector3 } from '../../types/drone';

interface ARDroneModelProps {
  drone: DroneData;
  onHit?: (droneId: string) => void;
  modelUrl: string;
  scene: THREE.Scene;
  camera: THREE.Camera;
}

const ARDroneModel: React.FC<ARDroneModelProps> = ({
  drone,
  onHit,
  modelUrl,
  scene,
  camera,
}) => {
  const modelRef = useRef<THREE.Group>();
  const boundingBoxesRef = useRef(new Map());
  const isDestroyedRef = useRef(false);
  const mixers = useMemo(() => [] as THREE.AnimationMixer[], []);
  const animationFrameRef = useRef<number>();
  const clock = useRef(new THREE.Clock());

  // MARK: - Animation Frame Handler
  const animate = useCallback(() => {
    const delta = clock.current.getDelta();
    mixers.forEach((mixer) => mixer.update(delta));
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [mixers]);

  // MARK: - Rotor Animation
  const initializeRotorAnimation = useCallback(
    (rotor: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(rotor);
      const center = box.getCenter(new THREE.Vector3());

      const pivot = new THREE.Object3D();
      pivot.position.copy(center);
      rotor.parent?.add(pivot);

      rotor.position.sub(center);
      pivot.add(rotor);

      const rotorMixer = new THREE.AnimationMixer(pivot);
      mixers.push(rotorMixer);

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
    },
    [mixers]
  );

  // MARK: - Start Animations
  const startAnimations = useCallback(() => {
    if (!modelRef.current) return;

    // Initialize rotor animations
    const rotorNames = ['Rotor_F_R', 'Rotor_F_L', 'Rotor_R_R', 'Rotor_R_L'];
    modelRef.current.traverse((child) => {
      if (rotorNames.includes(child.name)) {
        initializeRotorAnimation(child);
      }
    });

    // Initialize main animations
    const mainMixer = new THREE.AnimationMixer(modelRef.current);
    mixers.push(mainMixer);

    const initialPosition = modelRef.current.position.clone();

    // Hover animation
    const hoverTrack = new THREE.VectorKeyframeTrack(
      '.position[y]',
      [0, 1, 2],
      [initialPosition.y, initialPosition.y + 0.3, initialPosition.y]
    );

    const hoverClip = new THREE.AnimationClip('hover', 2, [hoverTrack]);
    const hoverAction = mainMixer.clipAction(hoverClip);
    hoverAction.setLoop(THREE.LoopPingPong, Infinity);
    hoverAction.play();

    // Patrol animation
    const patrolRadius = 5;
    const patrolDuration = 8;
    const patrolPoints = Array.from({ length: 31 }, (_, i) => {
      const angle = (i / 30) * Math.PI * 2;
      return {
        time: (i / 30) * patrolDuration,
        x: initialPosition.x + Math.cos(angle) * patrolRadius,
        z: initialPosition.z + Math.sin(angle) * patrolRadius,
      };
    });

    const patrolXTrack = new THREE.KeyframeTrack(
      '.position[x]',
      patrolPoints.map((p) => p.time),
      patrolPoints.map((p) => p.x)
    );

    const patrolZTrack = new THREE.KeyframeTrack(
      '.position[z]',
      patrolPoints.map((p) => p.time),
      patrolPoints.map((p) => p.z)
    );

    const patrolClip = new THREE.AnimationClip('patrol', patrolDuration, [
      patrolXTrack,
      patrolZTrack,
    ]);

    const patrolAction = mainMixer.clipAction(patrolClip);
    patrolAction.setLoop(THREE.LoopRepeat, Infinity);
    patrolAction.play();

    // Start animation loop
    animate();
  }, [mixers, initializeRotorAnimation, animate]);

  // MARK: - Model Loader
  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        const position = convertToVector3(drone.position);

        model.position.copy(position);
        model.scale.copy(DRONE_SCALE);
        model.userData.droneId = drone.droneId;

        // Bounding box setup
        const boundingBoxGeometry = new THREE.BoxGeometry(35, 25, 45);
        const boundingBoxMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          opacity: 0.2,
          transparent: true,
          visible: true,
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
        startAnimations();

        console.log('Drone model loaded:', {
          droneId: drone.droneId,
          position: model.position,
          boundingBox: boundingBox.getWorldPosition(new THREE.Vector3()),
        });
      },
      undefined,
      (error) => console.error('Error loading drone model:', error)
    );

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      mixers.forEach((mixer) => mixer.stopAllAction());
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }
    };
  }, [scene, modelUrl, drone.position, startAnimations, drone.droneId]);

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

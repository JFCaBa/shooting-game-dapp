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
  const boundingBoxRef = useRef<THREE.Mesh>();
  const isDestroyedRef = useRef(false);
  const mixers = useMemo(() => [] as THREE.AnimationMixer[], []);
  const clock = useRef(new THREE.Clock());
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  // MARK: - rotors animation
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

  // MARK: - startAnimations

  const startAnimations = useCallback(() => {
    if (!modelRef.current) return;

    // Find and animate all rotors
    const rotorNames = ['Rotor_F_R', 'Rotor_F_L', 'Rotor_R_R', 'Rotor_R_L'];
    modelRef.current.traverse((child) => {
      if (rotorNames.includes(child.name)) {
        initializeRotorAnimation(child);
      }
    });

    const mainMixer = new THREE.AnimationMixer(modelRef.current);
    mixers.push(mainMixer);

    const initialPosition = modelRef.current.position.clone();

    // Hover animation
    const hoverDuration = 2;
    const hoverHeight = 0.3;
    const hoverClip = new THREE.AnimationClip('hover', hoverDuration, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, hoverDuration / 2, hoverDuration],
        [initialPosition.y, initialPosition.y + hoverHeight, initialPosition.y]
      ),
    ]);
    mainMixer
      .clipAction(hoverClip)
      .setLoop(THREE.LoopPingPong, Infinity)
      .play();

    // Circular patrol animation
    const patrolDuration = 8;
    const patrolRadius = 5;
    const patrolPoints = new Array(31).fill(0).map((_, i) => {
      const angle = (i / 30) * Math.PI * 2;
      return {
        time: (i / 30) * patrolDuration,
        x: initialPosition.x + Math.cos(angle) * patrolRadius,
        z: initialPosition.z + Math.sin(angle) * patrolRadius,
      };
    });

    const patrolClip = new THREE.AnimationClip('patrol', patrolDuration, [
      new THREE.KeyframeTrack(
        '.position[x]',
        patrolPoints.map((p) => p.time),
        patrolPoints.map((p) => p.x)
      ),
      new THREE.KeyframeTrack(
        '.position[z]',
        patrolPoints.map((p) => p.time),
        patrolPoints.map((p) => p.z)
      ),
    ]);
    mainMixer.clipAction(patrolClip).setLoop(THREE.LoopRepeat, Infinity).play();
  }, [mixers, initializeRotorAnimation]);

  // MARK: - checkHit

  const checkHit = useCallback(
    (x: number, y: number) => {
      if (!modelRef.current || isDestroyedRef.current) return false;

      const mouse = new THREE.Vector2(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(modelRef.current, true);

      if (intersects.length > 0) {
        handleHit();
        return true;
      }
      return false;
    },
    [camera, raycaster]
  );

  // MARK: - handleHit

  const handleHit = useCallback(() => {
    if (isDestroyedRef.current || !modelRef.current) return false;
    isDestroyedRef.current = true;

    mixers.forEach((mixer) => mixer.stopAllAction());

    const fallMixer = new THREE.AnimationMixer(modelRef.current);
    mixers.push(fallMixer);

    const fallDuration = 2;
    const fallClip = new THREE.AnimationClip('fall', fallDuration, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, fallDuration],
        [modelRef.current.position.y, 0]
      ),
      new THREE.VectorKeyframeTrack(
        '.rotation[x]',
        [0, fallDuration],
        [0, Math.PI * 2 * (Math.random() - 0.5)]
      ),
      new THREE.VectorKeyframeTrack(
        '.rotation[z]',
        [0, fallDuration],
        [0, Math.PI * 2 * (Math.random() - 0.5)]
      ),
    ]);

    const fallAction = fallMixer.clipAction(fallClip);
    fallAction.setLoop(THREE.LoopOnce, 1);
    fallAction.clampWhenFinished = true;
    fallAction.play();

    setTimeout(() => {
      onHit?.(drone.droneId);
      scene.remove(modelRef.current!);
    }, fallDuration * 1000);

    return true;
  }, [drone.droneId, mixers, onHit, scene]);

  // MARK: - model loader

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

        const boundingBoxGeometry = new THREE.BoxGeometry(35, 15, 35);
        const boundingBoxMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          opacity: 0.2,
          transparent: true,
        });

        const boundingBox = new THREE.Mesh(
          boundingBoxGeometry,
          boundingBoxMaterial
        );
        boundingBox.position.set(0, 0, 0); // Adjust position relative to the drone model
        boundingBox.name = `BoundingBox_Drone_${drone.droneId}`; // Assign a unique name
        boundingBox.userData.droneId = drone.droneId; // Attach the drone ID for identification

        model.add(boundingBox); // Add to the drone model
        boundingBoxRef.current = boundingBox; // Keep a reference

        model.traverse((child) => {
          child.userData.droneId = drone.droneId;
          // Make sure each mesh can be hit by raycaster
          if (child instanceof THREE.Mesh) {
            child.userData.isTargetable = true;
          }
        });

        modelRef.current = model;
        scene.add(model);
        startAnimations();

        // Add click handler for this specific drone
        const handleClick = (event: MouseEvent) => {
          checkHit(event.clientX, event.clientY);
        };
        window.addEventListener('click', handleClick);

        return () => window.removeEventListener('click', handleClick);
      },
      undefined,
      (error) => console.error('Error loading drone model:', error)
    );

    const animate = () => {
      const delta = clock.current.getDelta();
      mixers.forEach((mixer) => mixer.update(delta));
      return requestAnimationFrame(animate);
    };

    const animationId = animate();
    return () => {
      cancelAnimationFrame(animationId);
      mixers.forEach((mixer) => mixer.stopAllAction());
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }
    };
  }, [scene, modelUrl, drone.position, startAnimations, mixers, checkHit]);

  useEffect(() => {
    if (modelRef.current && !isDestroyedRef.current) {
      const position = convertToVector3(drone.position);
      modelRef.current.position.copy(position);
    }
  }, [drone.position]);

  useEffect(() => {
    if (modelRef.current) {
      const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
      const boxHelper = modelRef.current.children.find(
        (child) => child instanceof THREE.Box3Helper
      ) as THREE.Box3Helper | undefined;

      if (boxHelper) {
        boxHelper.box.copy(boundingBox);
      }
    }
  }, [drone.position]);

  return null;
};

export default ARDroneModel;

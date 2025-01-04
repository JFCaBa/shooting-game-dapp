import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
import { DRONE_SCALE, DroneData, convertToVector3 } from '../../types/drone';
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

  // MARK: - Animations

  const startAnimations = useCallback(() => {
    if (!modelRef.current) return;

    const hoverAnimation = new THREE.AnimationMixer(modelRef.current);
    mixers.push(hoverAnimation);

    // Initial position from the drone model
    const initialPosition = modelRef.current.position.clone();

    // Larger radius and more points for smoother motion
    const radius = 20;
    const duration = 30;
    const points = 60;

    const keyTimes = Array.from(
      { length: points + 1 },
      (_, i) => i * (duration / points)
    );

    const xPositions = Array.from(
      { length: points + 1 },
      (_, i) =>
        initialPosition.x + Math.cos((i * 2 * Math.PI) / points) * radius
    );

    const zPositions = Array.from(
      { length: points + 1 },
      (_, i) =>
        initialPosition.z + Math.sin((i * 2 * Math.PI) / points) * radius
    );

    const hoverClip = new THREE.AnimationClip('hover', 4, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 2, 4],
        [initialPosition.y, initialPosition.y + 0.5, initialPosition.y]
      ),
    ]);

    const circularRotationClip = new THREE.AnimationClip(
      'circularRotation',
      duration,
      [
        new THREE.VectorKeyframeTrack('.position[x]', keyTimes, xPositions),
        new THREE.VectorKeyframeTrack('.position[z]', keyTimes, zPositions),
        new THREE.VectorKeyframeTrack(
          '.rotation[y]',
          keyTimes,
          Array.from(
            { length: points + 1 },
            (_, i) => (i * 2 * Math.PI) / points
          )
        ),
      ]
    );

    const hoverAction = hoverAnimation.clipAction(hoverClip);
    const circularAction = hoverAnimation.clipAction(circularRotationClip);

    hoverAction.setLoop(THREE.LoopPingPong, Infinity);
    circularAction.setLoop(THREE.LoopRepeat, Infinity);

    hoverAction.setDuration(4);
    circularAction.setDuration(12);

    // Add crossfade for smoother transitions
    hoverAction.fadeIn(0.5);
    circularAction.fadeIn(0.5);

    hoverAction.play();
    circularAction.play();
  }, [drone.position, mixers]);

  // MARK: - stopAnimations

  const stopAnimations = useCallback(() => {
    mixers.forEach((mixer) => mixer.stopAllAction());
    mixers.length = 0;
  }, [mixers]);

  // MARK: - Handle Hit

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

  // MARK: - Load Model

  const loadModel = useCallback(
    (scene: THREE.Scene, position: THREE.Vector3) => {
      if (!modelUrl) return;

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;

          // Calculate relative position from user
          const userPosition = new THREE.Vector3(0, 1.6, 0); // Average eye level
          const relativePosition = position.clone().sub(userPosition);

          // Apply minimum distance and height offset
          const minDistance = 2; // Minimum 2 meters from user
          const heightOffset = 1; // 1 meter above eye level

          relativePosition.normalize().multiplyScalar(minDistance);
          relativePosition.y += heightOffset;

          model.position.copy(relativePosition);
          modelRef.current = model;
          scene.add(modelRef.current);
          startAnimations();
        },
        undefined,
        (error) => console.error('Error loading drone model:', error)
      );
    },
    [modelUrl, startAnimations]
  );

  // MARK: - Scene

  useEffect(() => {
    if (!containerRef.current) return;

    if (!WEBGL.isWebGL2Available()) {
      const warning = WEBGL.getWebGL2ErrorMessage();
      containerRef.current.appendChild(warning);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 0);

    // Create renderer with proper settings
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    controlsRef.current = new DeviceOrientationControls(camera);

    // Force initial render
    renderer.render(scene, camera);

    // Load model with position
    loadModel(scene, convertToVector3(drone.position));

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.current.getDelta();
      mixers.forEach((mixer) => mixer.update(delta));
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (modelRef.current) {
        modelRef.current.removeFromParent();
      }
      controlsRef.current?.disconnect();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [drone.position, mixers, loadModel, handleHit]);

  return <div ref={containerRef} />;
};

export default ARDroneModel;

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DroneData, convertToVector3, DRONE_SCALE } from '../../types/drone';
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
  const mixers: THREE.AnimationMixer[] = [];
  const controlsRef = useRef<DeviceOrientationControls>();

  useEffect(() => {
    const initializeAR = async () => {
      if (!containerRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);

      const controls = new DeviceOrientationControls(camera);
      controlsRef.current = controls;

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          model.scale.copy(DRONE_SCALE);
          model.position.copy(convertToVector3(drone.position));

          modelRef.current = model;
          scene.add(model);
          startAnimations();
          // animate();
        },
        undefined,
        (error) => {
          console.error('Error loading drone model:', error);
        }
      );

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.current.getDelta();
        mixers.forEach((mixer) => mixer.update(delta));
        controls.update();
        renderer.render(scene, camera);
      };

      return () => {
        mixers.length = 0;
        if (modelRef.current) {
          stopAnimations();
          modelRef.current.removeFromParent();
        }
        containerRef.current?.removeChild(renderer.domElement);
      };
    };

    initializeAR();
  }, [modelUrl]);

  const startAnimations = () => {
    if (!modelRef.current) return;

    const hoverAnimation = new THREE.AnimationMixer(modelRef.current);
    mixers.push(hoverAnimation);
    const hoverClip = new THREE.AnimationClip('hover', 2, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 1, 2],
        [drone.position.y, drone.position.y + 0.5, drone.position.y]
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
    const hoverAction = hoverAnimation.clipAction(hoverClip);
    hoverAction.setLoop(THREE.LoopRepeat, Infinity);
    hoverAction.play();
    hoverAnimation.clipAction(circularRotationClip).play();
  };

  const stopAnimations = () => {
    mixers.forEach((mixer) => mixer.stopAllAction());
    mixers.length = 0;
  };

  const handleHit = () => {
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
        [
          0,
          0,
          0,
          Math.random() * 4 - 2,
          Math.random() * 4 - 2,
          Math.random() * 4 - 2,
        ]
      ),
    ]);
    const fallAction = fallAnimation.clipAction(fallClip);
    fallAction.setLoop(THREE.LoopOnce, 1);
    fallAction.clampWhenFinished = true;
    fallAction.play();

    if (onHit) {
      onHit(drone.droneId);
    }

    return true;
  };

  return <div ref={containerRef} />;
};

export default ARDroneModel;

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DroneData, DroneType, convertToVector3, DRONE_SCALE } from '../../types/drone';

interface ARDroneModelProps {
  drone: DroneData;
  onHit?: (droneId: string) => void;
  modelUrl: string;
}

const ARDroneModel: React.FC<ARDroneModelProps> = ({ drone, onHit, modelUrl }) => {
  const modelRef = useRef<THREE.Group>();
  const rotorsRef = useRef<THREE.Object3D[]>([]);
  const isDestroyedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.scale.copy(DRONE_SCALE);
        model.position.copy(convertToVector3(drone.position));
        
        // Find rotors
        const rotorNames = ['Rotor_F_R', 'Rotor_F_L', 'Rotor_R_R', 'Rotor_R_L'];
        rotorsRef.current = rotorNames
          .map(name => model.getObjectByName(name))
          .filter(rotor => rotor) as THREE.Object3D[];
        
        modelRef.current = model;
        scene.add(model);
        startAnimations();
        animate();
      },
      undefined,
      (error) => {
        console.error('Error loading drone model:', error);
      }
    );

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    return () => {
      if (modelRef.current) {
        stopAnimations();
        modelRef.current.removeFromParent();
      }
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [modelUrl]);

  const startAnimations = () => {
    if (!modelRef.current) return;

    // Rotor animation
    rotorsRef.current.forEach(rotor => {
      const rotateAnimation = new THREE.AnimationMixer(rotor);
      const rotationClip = new THREE.AnimationClip('rotate', 1, [
        new THREE.VectorKeyframeTrack(
          '.rotation[z]',
          [0, 1],
          [0, Math.PI * 2]
        )
      ]);
      
      const action = rotateAnimation.clipAction(rotationClip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    });

    // Hover animation
    const hoverAnimation = new THREE.AnimationMixer(modelRef.current);
    const hoverClip = new THREE.AnimationClip('hover', 2, [
      new THREE.VectorKeyframeTrack(
        '.position[y]',
        [0, 1, 2],
        [drone.position.y, drone.position.y + 0.05, drone.position.y]
      )
    ]);
    
    const hoverAction = hoverAnimation.clipAction(hoverClip);
    hoverAction.setLoop(THREE.LoopRepeat, Infinity);
    hoverAction.play();

    // Circular movement
    const radius = 4;
    const moveAnimation = new THREE.AnimationMixer(modelRef.current);
    const moveClip = new THREE.AnimationClip('move', 8, [
      new THREE.VectorKeyframeTrack(
        '.position',
        [0, 2, 4, 6, 8],
        [
          drone.position.x, drone.position.z, 0,
          drone.position.x + radius, drone.position.z, 0,
          drone.position.x, drone.position.z + radius, 0,
          drone.position.x - radius, drone.position.z, 0,
          drone.position.x, drone.position.z - radius, 0
        ]
      )
    ]);
    
    const moveAction = moveAnimation.clipAction(moveClip);
    moveAction.setLoop(THREE.LoopRepeat, Infinity);
    moveAction.play();
  };

  const stopAnimations = () => {
    rotorsRef.current.forEach(rotor => {
      if (rotor.userData.mixer) {
        rotor.userData.mixer.stopAllAction();
      }
    });
  };

  const handleHit = () => {
    if (isDestroyedRef.current || !modelRef.current) return false;
    isDestroyedRef.current = true;

    stopAnimations();
    
    // Create explosion particle system
    const particles = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xffa500,
        size: 0.02,
        blending: THREE.AdditiveBlending
      })
    );

    // Add falling animation
    const fallAnimation = new THREE.AnimationMixer(modelRef.current);
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
          0, 0, 0,
          Math.random() * 4 - 2,
          Math.random() * 4 - 2,
          Math.random() * 4 - 2
        ]
      )
    ]);
    
    const fallAction = fallAnimation.clipAction(fallClip);
    fallAction.setLoop(THREE.LoopOnce, 1);
    fallAction.clampWhenFinished = true;
    fallAction.play();

    // Notify parent
    if (onHit) {
      onHit(drone.droneId);
    }

    return true;
  };

  return <div ref={containerRef} />; // Three.js renders directly to the canvas
};

export default ARDroneModel;
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GeoObject } from '../../types/game';

interface GeoObjectNodeProps {
  geoObject: GeoObject;
  onHit?: (id: string) => void;
  scene: THREE.Scene;
  camera: THREE.Camera;
  onMounted?: (object: THREE.Object3D) => void;
}

const GeoObjectNode: React.FC<GeoObjectNodeProps> = ({
  geoObject,
  onHit,
  scene,
  camera,
  onMounted,
}) => {
  const modelRef = useRef<THREE.Group>();
  const isDestroyedRef = useRef(false);

  useEffect(() => {
    const loader = new GLTFLoader();
    const modelUrl = getModelUrlForType(geoObject.type);

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(
          geoObject.coordinate.latitude,
          geoObject.coordinate.altitude,
          geoObject.coordinate.longitude
        );

        // Scale based on type
        const scale = getScaleForType(geoObject.type);
        model.scale.set(scale, scale, scale);

        // Add metadata
        model.userData.geoObjectId = geoObject.id;
        model.userData.type = geoObject.type;
        model.traverse((child) => {
          child.userData.geoObjectId = geoObject.id;
          if (child instanceof THREE.Mesh) {
            child.userData.isTargetable = true;
          }
        });

        // Add bounding box for hit detection
        const boundingBox = new THREE.Box3().setFromObject(model);
        const boxGeometry = new THREE.BoxGeometry(
          boundingBox.max.x - boundingBox.min.x,
          boundingBox.max.y - boundingBox.min.y,
          boundingBox.max.z - boundingBox.min.z
        );
        const boxMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
        });
        const hitBox = new THREE.Mesh(boxGeometry, boxMaterial);
        hitBox.name = `HitBox_${geoObject.id}`;
        hitBox.userData.geoObjectId = geoObject.id;
        model.add(hitBox);

        // Add lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 1, 0);
        light.intensity = 2;
        model.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        model.add(ambientLight);

        // Add animations
        addAnimations(model);

        modelRef.current = model;
        scene.add(model);

        onMounted?.(model);
      },
      undefined,
      (error) => console.error('Error loading geoObject model:', geoObject.type)
    );

    return () => {
      if (modelRef.current && !isDestroyedRef.current) {
        scene.remove(modelRef.current);
      }
    };
  }, [scene, geoObject]);

  const getModelUrlForType = (type: string): string => {
    switch (type) {
      case 'weapon':
        return '/models/weapons_crate.glb';
      case 'powerup':
        return '/models/powerup.glb';
      case 'target':
        return '/models/target.glb';
      default:
        return '/models/default.glb';
    }
  };

  const getScaleForType = (type: string): number => {
    switch (type) {
      case 'weapon':
        return 0.03;
      case 'powerup':
        return 0.03;
      case 'target':
        return 0.01;
      default:
        return 0.05;
    }
  };

  const addAnimations = (model: THREE.Group) => {
    const animate = () => {
      if (!isDestroyedRef.current) {
        // Hover animation
        model.position.y += Math.sin(Date.now() * 0.002) * 0.001;

        // Slow rotation
        model.rotation.y += 0.01;

        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  return null;
};

export default GeoObjectNode;

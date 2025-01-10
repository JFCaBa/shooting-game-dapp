import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GeoObject } from '../../types/game';

interface GeoObjectNodeProps {
  geoObject: GeoObject;
  onHit?: (geoObjectId: string) => void;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cacheTexture?: (key: string, texture: THREE.Texture) => THREE.Texture;
  queueForDisposal?: (object: THREE.Object3D) => void;
}

const GeoObjectNode: React.FC<GeoObjectNodeProps> = ({
  geoObject,
  onHit,
  scene,
  camera,
  cacheTexture,
  queueForDisposal,
}) => {
  const objectRef = useRef<THREE.Group>();
  const isDestroyedRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isDestroyedRef.current) return;
    isDestroyedRef.current = true;

    if (queueForDisposal && objectRef.current) {
      queueForDisposal(objectRef.current);
    }
  }, [queueForDisposal]);

  // Create and setup object
  useEffect(() => {
    const group = new THREE.Group();
    group.name = `GeoObject_${geoObject.id}`;
    group.userData.geoObjectId = geoObject.id;

    // Create visual representation
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Create hitbox
    const hitboxGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      transparent: true,
      opacity: 0,
    });

    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.name = `HitBox_${geoObject.id}`;
    hitbox.userData.geoObjectId = geoObject.id;

    group.add(mesh);
    group.add(hitbox);

    // Position the object
    const position = new THREE.Vector3(
      geoObject.coordinate.longitude,
      geoObject.coordinate.altitude,
      geoObject.coordinate.latitude
    );
    group.position.copy(position);

    // Apply cached textures if available
    if (cacheTexture && material.map) {
      material.map = cacheTexture(`${geoObject.id}_texture`, material.map);
    }

    objectRef.current = group;
    scene.add(group);

    return () => {
      cleanup();
    };
  }, [scene, geoObject, cleanup, cacheTexture]);

  // Update position if needed
  useEffect(() => {
    if (objectRef.current && !isDestroyedRef.current) {
      const position = new THREE.Vector3(
        geoObject.coordinate.longitude,
        geoObject.coordinate.altitude,
        geoObject.coordinate.latitude
      );
      objectRef.current.position.copy(position);
    }
  }, [geoObject.coordinate]);

  return null;
};

export default GeoObjectNode;

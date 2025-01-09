import * as THREE from 'three';

export const disposeGeometry = (geometry: THREE.BufferGeometry): void => {
  geometry.dispose();

  // Clean up any attributes
  Object.keys(geometry.attributes).forEach((key) => {
    const attribute = geometry.attributes[key];
    if (attribute instanceof THREE.BufferAttribute) {
      attribute.array = new Float32Array(0);
    }
  });
};

export const disposeMaterial = (material: THREE.Material): void => {
  // Dispose of any textures
  Object.keys(material).forEach((prop) => {
    if (!material[prop]) return;
    if (material[prop] instanceof THREE.Texture) {
      material[prop].dispose();
    }
  });

  if (material instanceof THREE.MeshBasicMaterial) {
    if (material.map) material.map.dispose();
  } else if (material instanceof THREE.MeshStandardMaterial) {
    if (material.map) material.map.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
  }

  material.dispose();
};

export const disposeNode = (node: THREE.Object3D): void => {
  if (node instanceof THREE.Mesh) {
    if (node.geometry) {
      disposeGeometry(node.geometry);
    }

    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach(disposeMaterial);
      } else {
        disposeMaterial(node.material);
      }
    }
  }

  // Remove and dispose all children
  while (node.children.length > 0) {
    disposeNode(node.children[0]);
    node.remove(node.children[0]);
  }
};

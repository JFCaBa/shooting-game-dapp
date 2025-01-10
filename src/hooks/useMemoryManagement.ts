import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { memoryManager } from '../services/MemoryManagementService';

export const useMemoryManagement = (renderer: THREE.WebGLRenderer | null) => {
  const statsIntervalRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    if (!renderer) return;

    // Initialize memory manager with renderer
    memoryManager.initialize(renderer);

    // Set up periodic memory stats logging
    statsIntervalRef.current = setInterval(() => {
      const stats = memoryManager.getMemoryStats();
      console.debug('Memory stats:', stats);
    }, 30000);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      // Force cleanup on unmount
      memoryManager.cleanup();
    };
  }, [renderer]);

  return {
    queueForDisposal: (object: THREE.Object3D) =>
      memoryManager.queueForDisposal(object),
    cacheTexture: (key: string, texture: THREE.Texture) =>
      memoryManager.cacheTexture(key, texture),
    getCachedTexture: (key: string) => memoryManager.getCachedTexture(key),
    forceCleanup: () => memoryManager.cleanup(),
    getMemoryStats: () => memoryManager.getMemoryStats(),
  };
};

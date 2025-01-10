import * as THREE from 'three';

interface MemoryStats {
  geometries: number;
  textures: number;
  materials: number;
  meshes: number;
  totalMemory: number;
}

export class MemoryManagementService {
  private static instance: MemoryManagementService;
  private renderer: THREE.WebGLRenderer | null = null;
  private memoryWarningThreshold = 500; // MB
  private lastCleanupTime = 0;
  private cleanupInterval = 30000; // 30 seconds
  private disposeQueue: THREE.Object3D[] = [];
  private textureCache: Map<string, THREE.Texture> = new Map();

  private constructor() {
    // Private constructor for singleton
    setInterval(() => this.checkMemoryUsage(), 10000); // Check every 10 seconds
  }

  static getInstance(): MemoryManagementService {
    if (!MemoryManagementService.instance) {
      MemoryManagementService.instance = new MemoryManagementService();
    }
    return MemoryManagementService.instance;
  }

  initialize(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
  }

  // Get current memory usage statistics
  getMemoryStats(): MemoryStats {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }

    const info = this.renderer.info;
    return {
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      materials: 0, // Need to track manually
      meshes: 0, // Need to track manually
      totalMemory: this.estimateTotalMemory(),
    };
  }

  // Cache texture for reuse
  cacheTexture(key: string, texture: THREE.Texture) {
    if (!this.textureCache.has(key)) {
      this.textureCache.set(key, texture);
    }
    return this.textureCache.get(key);
  }

  // Get cached texture
  getCachedTexture(key: string): THREE.Texture | undefined {
    return this.textureCache.get(key);
  }

  // Add object to disposal queue
  queueForDisposal(object: THREE.Object3D) {
    this.disposeQueue.push(object);
  }

  // Clean up resources
  cleanup() {
    const now = Date.now();
    if (now - this.lastCleanupTime < this.cleanupInterval) {
      return;
    }

    console.log('Performing memory cleanup...');
    this.lastCleanupTime = now;

    // Process disposal queue
    while (this.disposeQueue.length > 0) {
      const object = this.disposeQueue.pop();
      if (object) {
        this.disposeObject(object);
      }
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Clear renderer cache
    if (this.renderer) {
      this.renderer.dispose();
    }

    console.log('Memory cleanup completed', this.getMemoryStats());
  }

  // Dispose of specific object and its children
  private disposeObject(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) =>
              this.disposeMaterial(material)
            );
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });

    if (object.parent) {
      object.parent.remove(object);
    }
  }

  // Dispose of material and its textures
  private disposeMaterial(material: THREE.Material) {
    Object.keys(material).forEach((prop) => {
      if (material[prop] && material[prop].isTexture) {
        const texture = material[prop] as THREE.Texture;
        texture.dispose();
      }
    });
    material.dispose();
  }

  // Estimate total memory usage
  private estimateTotalMemory(): number {
    if (!this.renderer) return 0;

    const info = this.renderer.info;
    // Rough estimation in MB
    return (
      info.memory.geometries * 0.5 + // Average geometry size
      info.memory.textures * 2 + // Average texture size
      this.disposeQueue.length * 0.1 // Pending disposals
    );
  }

  // Check if memory usage exceeds threshold
  private checkMemoryUsage() {
    const stats = this.getMemoryStats();
    if (stats.totalMemory > this.memoryWarningThreshold) {
      console.warn('Memory usage high, forcing cleanup...', stats);
      this.cleanup();
    }
  }
}

// Export singleton instance
export const memoryManager = MemoryManagementService.getInstance();

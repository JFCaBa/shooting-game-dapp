import * as THREE from 'three';
import { disposeGeometry, disposeMaterial } from '../../../utils/three-utils';

interface SmokeEffectOptions {
  color?: number;
  particleCount?: number;
  particleSize?: number;
  initialOpacity?: number;
  fadeSpeed?: number;
  spreadRadius?: number;
  riseSpeed?: number;
  turbulence?: number;
  duration?: number;
}

export class SmokeEffect {
  private readonly scene: THREE.Scene;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.PointsMaterial;
  private readonly points: THREE.Points;
  private readonly options: Required<SmokeEffectOptions>;
  private animationFrameId: number | null = null;
  private startTime: number;
  private isDestroyed = false;

  private static readonly DEFAULT_OPTIONS: Required<SmokeEffectOptions> = {
    color: 0xff0000,
    particleCount: 50,
    particleSize: 1,
    initialOpacity: 0.5,
    fadeSpeed: 0.01,
    spreadRadius: 1,
    riseSpeed: 0.05,
    turbulence: 0.1,
    duration: 3000, // milliseconds
  };

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    options: SmokeEffectOptions = {}
  ) {
    this.scene = scene;
    this.options = { ...SmokeEffect.DEFAULT_OPTIONS, ...options };
    this.startTime = performance.now();

    // Create material with custom parameters
    this.material = new THREE.PointsMaterial({
      color: this.options.color,
      size: this.options.particleSize,
      transparent: true,
      opacity: this.options.initialOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.points = this.createSmokeParticles(position);

    // Add to scene and start animation
    this.scene.add(this.points);
    this.animate();

    // Auto-cleanup after duration
    setTimeout(() => {
      if (!this.isDestroyed) {
        this.destroy();
      }
    }, this.options.duration);
  }

  private createSmokeParticles(position: THREE.Vector3): THREE.Points {
    const particles: number[] = [];
    const velocities: number[] = [];
    const radius = this.options.spreadRadius;

    for (let i = 0; i < this.options.particleCount; i++) {
      // Position with random spread
      particles.push(
        position.x + (Math.random() * 2 - 1) * radius,
        position.y + Math.random() * radius,
        position.z + (Math.random() * 2 - 1) * radius
      );

      // Initial velocities for more natural movement
      velocities.push(
        (Math.random() * 2 - 1) * this.options.turbulence,
        Math.random() * this.options.riseSpeed + this.options.riseSpeed * 0.5,
        (Math.random() * 2 - 1) * this.options.turbulence
      );
    }

    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(particles, 3)
    );
    this.geometry.setAttribute(
      'velocity',
      new THREE.Float32BufferAttribute(velocities, 3)
    );

    return new THREE.Points(this.geometry, this.material);
  }

  private animate(): void {
    if (this.isDestroyed) return;

    const elapsedTime = performance.now() - this.startTime;
    const progress = Math.min(elapsedTime / this.options.duration, 1);

    // Update positions based on velocities and time
    const positions = this.geometry.getAttribute('position');
    const velocities = this.geometry.getAttribute('velocity');

    for (let i = 0; i < positions.count; i++) {
      // Apply velocity with some turbulence
      positions.setX(i, positions.getX(i) + velocities.getX(i));
      positions.setY(i, positions.getY(i) + velocities.getY(i));
      positions.setZ(i, positions.getZ(i) + velocities.getZ(i));

      // Add some turbulence over time
      velocities.setX(
        i,
        velocities.getX(i) +
          (Math.random() - 0.5) * this.options.turbulence * 0.1
      );
      velocities.setZ(
        i,
        velocities.getZ(i) +
          (Math.random() - 0.5) * this.options.turbulence * 0.1
      );
    }

    positions.needsUpdate = true;
    velocities.needsUpdate = true;

    // Fade out based on progress
    this.material.opacity = this.options.initialOpacity * (1 - progress);

    if (progress >= 1) {
      this.destroy();
    } else {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Cancel animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove from scene
    if (this.points && this.scene) {
      this.scene.remove(this.points);
    }

    // Dispose resources
    this.geometry.dispose();
    this.material.dispose();

    // Ensure no lingering references
    this.points.geometry = null;
    this.points.material = null;
  }

  public isActive(): boolean {
    return !this.isDestroyed;
  }

  public setColor(color: number): void {
    if (!this.isDestroyed) {
      this.material.color.setHex(color);
    }
  }

  public setOpacity(opacity: number): void {
    if (!this.isDestroyed) {
      this.material.opacity = Math.max(0, Math.min(1, opacity));
    }
  }
}

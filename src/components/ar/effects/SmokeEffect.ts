import * as THREE from 'three';

interface SmokeEffectOptions {
  color?: number;
  particleCount?: number;
  duration?: number;
}

export class SmokeEffect {
  private scene: THREE.Scene;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private startTime: number;
  private readonly duration: number;
  private isDestroyed: boolean = false;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    options: SmokeEffectOptions = {}
  ) {
    this.scene = scene;
    this.startTime = Date.now();
    this.duration = options.duration || 2000;

    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: options.color || 0xff0000,
      size: 1,
      transparent: true,
      opacity: 0.5,
    });

    const particleCount = options.particleCount || 50;
    const particles = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particles[i3] = position.x + (Math.random() - 0.5) * 2;
      particles[i3 + 1] = position.y + Math.random() * 2;
      particles[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
    }

    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(particles, 3)
    );

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.animate();
  }

  private animate = () => {
    if (this.isDestroyed) return;

    const elapsedTime = Date.now() - this.startTime;
    const progress = elapsedTime / this.duration;

    if (progress >= 1) {
      this.destroy();
      return;
    }

    const positions = this.geometry.getAttribute('position');
    const count = positions.count;

    for (let i = 0; i < count; i++) {
      positions.setY(i, positions.getY(i) + 0.05);
      positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.1);
      positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.1);
    }

    positions.needsUpdate = true;
    this.material.opacity = Math.max(0, 0.5 * (1 - progress));

    requestAnimationFrame(this.animate);
  };

  public destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }

  public getParticleSystem(): THREE.Points {
    return this.points;
  }

  public isActive(): boolean {
    return !this.isDestroyed;
  }
}

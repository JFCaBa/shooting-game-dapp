import * as THREE from 'three';

export class PullDownEffect {
  private readonly scene: THREE.Scene;
  private readonly drone: THREE.Group;
  private animationFrameId: number | null = null;
  private startTime: number;
  private isDown = false;

  constructor(scene: THREE.Scene, drone: THREE.Group) {
    this.scene = scene;
    this.drone = drone;
    this.startTime = performance.now();

    // Add to scene and start animation
    this.scene.add(this.drone);

    // Auto-cleanup after duration
    setTimeout(() => {
      if (!this.isDown) {
        this.destroy();
      }
    }, 1000);
  }

  private createFallDownAnimation(drone: THREE.Mesh) {
    const originalPosition = drone.position.clone();
    const targetPosition = new THREE.Vector3(
      originalPosition.x + 5,
      originalPosition.y - 5,
      originalPosition.z - 5
    );

    const duration = 1;
    const startTime = performance.now();

    const animateDownward = () => {
      const elapsedTime = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsedTime / duration, 1);

      drone.position.lerpVectors(originalPosition, targetPosition, progress);

      if (progress < 1) {
        requestAnimationFrame(animateDownward);
      } else {
        const audio = new Audio('/assets/explosion_sound.wav');
        audio.play();
      }
    };

    animateDownward();
  }

  public destroy(): void {
    if (this.isDown) return;
    this.isDown = true;

    // Cancel animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove from scene
    if (this.drone && this.scene) {
      this.scene.remove(this.drone);
    }
  }

  public isActive(): boolean {
    return !this.isDown;
  }
}

import * as THREE from 'three';

export class SmokeEffect {
  private scene: THREE.Scene;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.scene = scene;
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: 0xff0000,
      size: 1,
      transparent: true,
      opacity: 0.5,
    });
    this.points = this.createSmokeParticles(position);
    this.scene.add(this.points);
    this.animate();
  }

  private createSmokeParticles(position: THREE.Vector3): THREE.Points {
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push(
        position.x + Math.random() * 2 - 1,
        position.y + Math.random() * 2,
        position.z + Math.random() * 2 - 1
      );
    }
    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(particles, 3)
    );
    return new THREE.Points(this.geometry, this.material);
  }

  private animate(): void {
    const animateFrame = () => {
      const positions = this.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, positions.getY(i) + 0.05);
        positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.1);
        positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.1);
      }
      positions.needsUpdate = true;

      this.material.opacity -= 0.01;
      if (this.material.opacity <= 0) {
        this.scene.remove(this.points);
      } else {
        requestAnimationFrame(animateFrame);
      }
    };

    animateFrame();
  }
}

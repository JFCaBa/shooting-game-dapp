import * as THREE from 'three';
import { DeviceOrientationControls } from 'three-stdlib';

export class ARSceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: DeviceOrientationControls;
  private isDestroyed: boolean = false;
  private animationFrameId: number | null = null;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer(container);
    this.controls = new DeviceOrientationControls(this.camera);
    this.setupLighting();
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 0);
    camera.rotation.set(0, 0, 0);
    return camera;
  }

  private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    return renderer;
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(ambientLight, directionalLight);
  }

  public update(): void {
    if (this.isDestroyed) return;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public startAnimation(): void {
    const animate = () => {
      if (this.isDestroyed) return;

      this.animationFrameId = requestAnimationFrame(animate);
      this.update();
    };
    animate();
  }

  public handleResize(): void {
    if (this.isDestroyed) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public cleanup(): void {
    this.isDestroyed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.controls.disconnect();

    // Clean up scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    // Remove canvas from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // Dispose renderer
    this.renderer.dispose();
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public isActive(): boolean {
    return !this.isDestroyed;
  }
}

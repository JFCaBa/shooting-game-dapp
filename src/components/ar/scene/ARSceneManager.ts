import * as THREE from 'three';
import { DeviceOrientationControls } from 'three-stdlib';
import { geoObjectManager } from '../../../services/GeoObjectManager';

export class ARSceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: DeviceOrientationControls;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement) {
    console.log('Initializing AR Scene Manager');
    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer(container);
    this.controls = this.createControls();
    this.setupLighting();
    this.setupGeoObjectManager();
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
    console.log('Camera created:', {
      position: camera.position,
      rotation: camera.rotation,
    });
    return camera;
  }

  private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    console.log('Renderer created');
    return renderer;
  }

  private createControls(): DeviceOrientationControls {
    const controls = new DeviceOrientationControls(this.camera);
    console.log('Device orientation controls created');
    return controls;
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(directionalLight);
    console.log('Lighting setup completed');
  }

  private setupGeoObjectManager(): void {
    geoObjectManager.initialize(this.scene);
    geoObjectManager.setUpdateCallback((count) => {
      console.log('GeoObject count updated:', count);
    });
    console.log('GeoObjectManager initialized');
  }

  public startAnimation(): void {
    if (this.isDestroyed || this.animationFrameId !== null) return;

    const animate = () => {
      if (this.isDestroyed) return;

      if (this.controls) {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    console.log('Animation loop started');
  }

  public handleResize(): void {
    if (this.isDestroyed) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  public cleanup(): void {
    if (this.isDestroyed) return;
    console.log('Cleaning up AR Scene Manager');
    this.isDestroyed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.controls.disconnect();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // Clear scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    console.log('Cleanup completed');
  }

  public getScene(): THREE.Scene {
    if (this.isDestroyed) {
      throw new Error('ARSceneManager has been destroyed');
    }
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    if (this.isDestroyed) {
      throw new Error('ARSceneManager has been destroyed');
    }
    return this.camera;
  }

  public isActive(): boolean {
    return !this.isDestroyed;
  }
}

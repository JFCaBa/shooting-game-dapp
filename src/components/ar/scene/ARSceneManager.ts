import * as THREE from 'three';
import { DeviceOrientationControls } from 'three-stdlib';
import {
  disposeGeometry,
  disposeMaterial,
  disposeNode,
} from '../../../utils/three-utils';

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

    // Log initial setup
    console.log('Camera position:', this.camera.position);
    console.log('Scene children:', this.scene.children.length);
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75, // Wider FOV for AR
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 2); // Eye level height, moved back for better view
    camera.lookAt(0, 1.6, 0); // Look straight ahead
    return camera;
  }

  private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    console.log('Creating WebGL renderer...');
    const renderer = new THREE.WebGLRenderer({
      alpha: true, // Enable transparency
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Fully transparent background
    renderer.setPixelRatio(window.devicePixelRatio);

    // Make sure the canvas is transparent
    renderer.domElement.style.background = 'transparent';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';

    // Clear any existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    console.log('WebGL renderer created and added to container');
    return renderer;
  }

  private createControls(): DeviceOrientationControls {
    const controls = new DeviceOrientationControls(this.camera);
    console.log('Device orientation controls created');
    return controls;
  }

  private setupLighting(): void {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light for shadows and depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    console.log('Lighting setup completed');
  }

  public handleResize(): void {
    if (this.isDestroyed) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    console.log('Resize handled');
  }

  public update(): void {
    if (this.isDestroyed) return;

    // Update device orientation controls
    if (this.controls) {
      this.controls.update();
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  public startAnimation(): void {
    if (this.isDestroyed || this.animationFrameId !== null) return;

    const animate = () => {
      this.update();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    console.log('Animation loop started');
  }

  public cleanup(): void {
    if (this.isDestroyed) return;
    console.log('Cleaning up AR Scene Manager');
    this.isDestroyed = true;

    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Dispose of all scene objects recursively
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          disposeGeometry(object.geometry);
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(disposeMaterial);
          } else {
            disposeMaterial(object.material);
          }
        }
      }
    });

    // Clear scene hierarchy
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);
      disposeNode(child);
    }

    // Clean up controls
    if (this.controls) {
      this.controls.disconnect();
    }

    // Clean up renderer
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
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

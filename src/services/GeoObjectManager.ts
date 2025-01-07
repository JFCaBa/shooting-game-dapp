import * as THREE from 'three';
import { GeoObject, LocationData } from '../types/game';
import { locationService } from './LocationService';

export class GeoObjectManager {
  private static instance: GeoObjectManager;
  private scene: THREE.Scene | null = null;
  private objects: Map<string, GeoObject> = new Map();
  private nodes: Map<string, THREE.Group> = new Map();
  private onUpdateCallback: ((count: number) => void) | null = null;
  private onHitCallback: ((geoObject: GeoObject) => void) | null = null;

  private constructor() {}

  static getInstance(): GeoObjectManager {
    if (!GeoObjectManager.instance) {
      GeoObjectManager.instance = new GeoObjectManager();
    }
    return GeoObjectManager.instance;
  }

  initialize(scene: THREE.Scene) {
    console.log('Initializing GeoObjectManager with scene');
    this.scene = scene;
  }

  setUpdateCallback(callback: (count: number) => void) {
    this.onUpdateCallback = callback;
  }

  setHitCallback(callback: (geoObject: GeoObject) => void) {
    this.onHitCallback = callback;
  }

  async spawnGeoObject(geoObject: GeoObject) {
    if (!this.scene) {
      console.error('Scene not initialized');
      return;
    }

    console.log('Spawning GeoObject:', geoObject);

    try {
      const userLocation = await locationService.getCurrentLocation();
      const position = this.calculatePosition(
        geoObject.coordinate,
        userLocation
      );

      const node = this.createNode(geoObject, position);
      this.objects.set(geoObject.id, geoObject);
      this.nodes.set(geoObject.id, node);
      this.scene.add(node);

      this.onUpdateCallback?.(this.objects.size);

      console.log('GeoObject spawned:', {
        id: geoObject.id,
        type: geoObject.type,
        position,
        userLocation,
        objectLocation: geoObject.coordinate,
      });
    } catch (error) {
      console.error('Error spawning GeoObject:', error);
    }
  }

  handleHit(geoObjectId: string): boolean {
    const geoObject = this.objects.get(geoObjectId);
    const node = this.nodes.get(geoObjectId);

    if (!geoObject || !node || !this.scene) return false;

    console.log('Handling hit for GeoObject:', geoObjectId);

    // Notify about the hit
    this.onHitCallback?.(geoObject);

    // Remove after animation
    setTimeout(() => {
      if (this.scene) {
        this.scene.remove(node);
        this.objects.delete(geoObjectId);
        this.nodes.delete(geoObjectId);
        this.onUpdateCallback?.(this.objects.size);
      }
    }, 2000);

    return true;
  }

  updatePositions(userLocation: LocationData, heading: number) {
    this.objects.forEach((geoObject, id) => {
      const node = this.nodes.get(id);
      if (node) {
        const newPosition = this.calculatePosition(
          geoObject.coordinate,
          userLocation
        );
        node.position.copy(newPosition);

        // Make object face the user
        node.lookAt(new THREE.Vector3(0, node.position.y, 0));
        node.rotateY(Math.PI);
      }
    });
  }

  private calculatePosition(
    objectLocation: LocationData,
    userLocation: LocationData
  ): THREE.Vector3 {
    const distance = locationService.calculateDistance(
      userLocation,
      objectLocation
    );
    const bearing = locationService.calculateBearing(
      userLocation,
      objectLocation
    );

    // Convert polar coordinates to Cartesian
    const radians = (bearing * Math.PI) / 180;
    const x = distance * Math.sin(radians);
    const z = distance * Math.cos(radians);
    const y = objectLocation.altitude - userLocation.altitude;

    console.log('Calculated position:', {
      distance,
      bearing,
      x,
      y,
      z,
      objectLocation,
      userLocation,
    });

    return new THREE.Vector3(x, y, z);
  }

  private createNode(
    geoObject: GeoObject,
    position: THREE.Vector3
  ): THREE.Group {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: this.getColorForType(geoObject.type),
    });

    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    group.position.copy(position);

    // Add metadata
    group.userData.geoObjectId = geoObject.id;
    group.userData.type = geoObject.type;

    // Add hit detection box
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.name = `HitBox_${geoObject.id}`;
    group.add(hitBox);

    return group;
  }

  private getColorForType(type: string): number {
    switch (type) {
      case 'weapon':
        return 0x0000ff;
      case 'powerup':
        return 0xffff00;
      case 'target':
        return 0xff0000;
      default:
        return 0x808080;
    }
  }
}

export const geoObjectManager = GeoObjectManager.getInstance();

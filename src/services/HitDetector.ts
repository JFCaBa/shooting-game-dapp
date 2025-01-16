// src/services/HitDetector.ts

import * as THREE from 'three';
import { HitValidationService } from './HitValidationService';
import { LocationData } from '../types/game';

type DroneHitCallback = (
  droneId: string,
  hitPosition: THREE.Vector3,
  drone: THREE.Group
) => void;

type GeoObjectHitCallback = (
  geoObjectId: string,
  hitPosition: THREE.Vector3
) => void;

type PlayerHitCallback = (playerId: string, hitPosition: THREE.Vector3) => void;

export class HitDetector {
  private raycaster: THREE.Raycaster;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private hitValidationService: HitValidationService;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.raycaster = new THREE.Raycaster();
    this.scene = scene;
    this.camera = camera;
    this.hitValidationService = new HitValidationService();
  }

  public async checkHit(
    onDroneHit: DroneHitCallback,
    onGeoObjectHit: GeoObjectHitCallback,
    onPlayerHit?: PlayerHitCallback
  ): Promise<void> {
    const crosshair = new THREE.Vector2(0, 0.33);
    this.raycaster.setFromCamera(crosshair, this.camera);

    // Debug ray visualization
    const rayHelper = new THREE.ArrowHelper(
      this.raycaster.ray.direction,
      this.camera.position,
      50,
      0xff0000,
      2,
      1
    );
    this.scene.add(rayHelper);

    const targetGroup = this.getTargetMeshes();
    const intersects = this.raycaster.intersectObjects(targetGroup);

    if (intersects.length > 0) {
      await this.processHit(intersects[0], {
        onDroneHit,
        onGeoObjectHit,
        onPlayerHit,
      });
    }

    setTimeout(() => {
      if (this.scene) {
        this.scene.remove(rayHelper);
      }
    }, 500);
  }

  private getTargetMeshes(): THREE.Object3D[] {
    const targetMeshes: THREE.Object3D[] = [];
    const seenIds = new Set<string>();

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.name?.startsWith('BoundingBox_Drone_')) {
          const droneId = object.userData.droneId;
          if (!seenIds.has(droneId)) {
            seenIds.add(droneId);
            targetMeshes.push(object);
          }
        } else if (object.name?.startsWith('HitBox_')) {
          const geoObjectId = object.userData.geoObjectId;
          if (!seenIds.has(geoObjectId)) {
            seenIds.add(geoObjectId);
            targetMeshes.push(object);
          }
        } else if (object.name?.startsWith('Player_')) {
          const playerId = object.userData.playerId;
          if (!seenIds.has(playerId)) {
            seenIds.add(playerId);
            targetMeshes.push(object);
          }
        }
      }
    });

    return targetMeshes;
  }

  private getObjectLocation(object: THREE.Object3D): LocationData {
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);

    return {
      latitude: worldPosition.x,
      longitude: worldPosition.z,
      altitude: worldPosition.y,
      accuracy: 1.0,
    };
  }

  private getCameraFeed(): ImageData | undefined {
    // Get camera feed from the video element if available
    const videoElement = document.querySelector('video');
    if (!videoElement) return undefined;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.drawImage(videoElement, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private async processHit(
    intersection: THREE.Intersection,
    callbacks: {
      onDroneHit: DroneHitCallback;
      onGeoObjectHit: GeoObjectHitCallback;
      onPlayerHit?: PlayerHitCallback;
    }
  ): Promise<void> {
    let hitObject = intersection.object;
    const hitPosition = intersection.point.clone();
    const shooterLocation = this.getObjectLocation(this.camera);

    if (hitObject.name?.startsWith('BoundingBox_Drone_')) {
      while (hitObject.parent && !hitObject.userData.isMainDroneModel) {
        hitObject = hitObject.parent;
      }
      const droneId = hitObject.userData.droneId;
      if (droneId) {
        const targetLocation = this.getObjectLocation(hitObject);
        const validation = await this.hitValidationService.validateHit(
          shooterLocation,
          this.camera.rotation.y,
          targetLocation,
          'drone'
        );

        if (validation.isValid) {
          callbacks.onDroneHit(droneId, hitPosition, hitObject as THREE.Group);
          this.scene.remove(hitObject);
        }
      }
    } else if (hitObject.name?.startsWith('HitBox_')) {
      const geoObjectId = hitObject.userData.geoObjectId;
      if (geoObjectId) {
        const targetLocation = this.getObjectLocation(hitObject);
        const validation = await this.hitValidationService.validateHit(
          shooterLocation,
          this.camera.rotation.y,
          targetLocation,
          'geoObject'
        );

        if (validation.isValid) {
          callbacks.onGeoObjectHit(geoObjectId, hitPosition);
        }
      }
    } else if (hitObject.name?.startsWith('Player_') && callbacks.onPlayerHit) {
      const playerId = hitObject.userData.playerId;
      if (playerId) {
        const targetLocation = this.getObjectLocation(hitObject);
        const cameraFeed = this.getCameraFeed();
        const validation = await this.hitValidationService.validateHit(
          shooterLocation,
          this.camera.rotation.y,
          targetLocation,
          'player',
          cameraFeed
        );

        if (validation.isValid) {
          callbacks.onPlayerHit(playerId, hitPosition);
        }
      }
    }
  }
}

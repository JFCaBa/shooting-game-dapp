import * as THREE from 'three';

type DroneHitCallback = (droneId: string, hitPosition: THREE.Vector3) => void;
type GeoObjectHitCallback = (
  geoObjectId: string,
  hitPosition: THREE.Vector3
) => void;

export class HitDetector {
  private raycaster: THREE.Raycaster;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.raycaster = new THREE.Raycaster();
    this.scene = scene;
    this.camera = camera;
  }

  public checkHit(
    onDroneHit: DroneHitCallback,
    onGeoObjectHit: GeoObjectHitCallback
  ): void {
    const crosshair = new THREE.Vector2(0, 0.33);
    this.raycaster.setFromCamera(crosshair, this.camera);

    const targetMeshes = this.getTargetMeshes();
    const intersects = this.raycaster.intersectObjects(targetMeshes);

    if (intersects.length > 0) {
      this.processHit(intersects[0], onDroneHit, onGeoObjectHit);
    }
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
        }
      }
    });

    return targetMeshes;
  }

  private processHit(
    intersection: THREE.Intersection,
    onDroneHit: DroneHitCallback,
    onGeoObjectHit: GeoObjectHitCallback
  ): void {
    let hitObject = intersection.object;
    const hitPosition = intersection.point.clone();

    if (hitObject.name?.startsWith('BoundingBox_Drone_')) {
      while (hitObject.parent && !hitObject.userData.isMainDroneModel) {
        hitObject = hitObject.parent;
      }
      const droneId = hitObject.userData.droneId;
      if (droneId) {
        onDroneHit(droneId, hitPosition);
      }
    } else if (hitObject.name?.startsWith('HitBox_')) {
      const geoObjectId = hitObject.userData.geoObjectId;
      if (geoObjectId) {
        onGeoObjectHit(geoObjectId, hitPosition);
      }
    }
  }
}

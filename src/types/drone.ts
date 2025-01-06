import { Vector3 } from 'three';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface DroneData {
  droneId: string;
  position: Position3D;
  reward?: number;
}

export enum DroneType {
  FourRotorOne = 'fourRotorOne',
  Box = 'box',
}

export interface DroneAnimations {
  rotors: Animation[];
  hover: Animation;
  movement: Animation;
}

export const convertToVector3 = (pos: Position3D): Vector3 => {
  return new Vector3(pos.x, pos.y, pos.z);
};

export const DRONE_SCALE = new Vector3(0.05, 0.05, 0.05);

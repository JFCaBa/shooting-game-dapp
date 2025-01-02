// src/types/game.ts

export type LocationData = {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
};

export type Player = {
  playerId: string;
  location: LocationData;
  heading: number;
};

export type ShootData = {
  playerId?: string;
  shotId?: string;
  hitPlayerId?: string;
  damage: number;
  distance: number;
  deviation: number;
  heading: number;
  location?: LocationData;
};

export type DroneData = {
  id: string;
  location: LocationData;
  targetLocation: LocationData;
  timeoutSeconds: number;
};

export type GeoObject = {
  id: string;
  type: string;
  location: LocationData;
  properties: Record<string, any>;
};

export type GameScore = {
  hits: number;
  kills: number;
};

export enum MessageType {
  JOIN = 'join',
  SHOOT = 'shoot',
  SHOOT_CONFIRMED = 'shootConfirmed',
  HIT = 'hit',
  KILL = 'kill',
  HIT_CONFIRMED = 'hitConfirmed',
  LEAVE = 'leave',
  ANNOUNCED = 'announced',
  NEW_DRONE = 'newDrone',
  DRONE_SHOOT_CONFIRMED = 'droneShootConfirmed',
  DRONE_SHOOT_REJECTED = 'droneShootRejected',
  NEW_GEO_OBJECT = 'newGeoObject',
  GEO_OBJECT_HIT = 'geoObjectHit',
  GEO_OBJECT_SHOOT_CONFIRMED = 'geoObjectShootConfirmed',
  GEO_OBJECT_SHOOT_REJECTED = 'geoObjectShootRejected'
}

export type GameMessageData = {
  player?: Player;
  shoot?: ShootData;
  drone?: DroneData;
  geoObject?: GeoObject;
  location?: LocationData;
  playerId?: string;
  kind?: string;
  heading?: number;
  hitPlayerId?: string;
  damage?: number;
  distance?: number;
  deviation?: number;
};

export type GameMessage = {
  type: MessageType;
  playerId: string;
  data: GameMessageData;
  senderId?: string;
  pushToken?: string;
};
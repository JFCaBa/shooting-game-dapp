// src/types/game.ts
export type LocationData = {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
};

export type Player = {
  playerId: string;
  location?: LocationData;
  heading: number;
};

export type ShootData = {
  playerId?: string;
  shotId?: string;
  hitPlayerId?: string;
  damage: number;
  distance: number;
  deviation?: number;
  heading: number;
  location?: LocationData;
};

export type DroneData = {
  droneId: string;
  kind: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  reward?: number;
};

export type GeoObject = {
  id: string;
  type: string;
  coordinate: LocationData;
  kind?: string;
  metadata?: Record<string, any>;
};

export type GameScore = {
  hits: number;
  kills: number;
};

export enum MessageType {
  WEBSOCKET_CONNECTED = 'websocket_connected',
  JOIN = 'join',
  STATS = 'stats',
  SHOOT = 'shoot',
  SHOOT_CONFIRMED = 'shootConfirmed',
  HIT = 'hit',
  KILL = 'kill',
  HIT_CONFIRMED = 'hitConfirmed',
  RELOAD = 'reload',
  LEAVE = 'leave',
  ANNOUNCED = 'announced',
  NEW_DRONE = 'newDrone',
  SHOOT_DRONE = 'shootDrone',
  DRONE_SHOOT_CONFIRMED = 'droneShootConfirmed',
  DRONE_SHOOT_REJECTED = 'droneShootRejected',
  NEW_GEO_OBJECT = 'newGeoObject',
  GEO_OBJECT_HIT = 'geoObjectHit',
  GEO_OBJECT_SHOOT_CONFIRMED = 'geoObjectShootConfirmed',
  GEO_OBJECT_SHOOT_REJECTED = 'geoObjectShootRejected',
}

export type GameMessageData = {
  player?: Player;
  shoot?: ShootData;
  drone?: DroneData;
  droneId?: String;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  reward?: number;
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
  data?: GameMessageData;
  senderId?: string;
  pushToken?: string;
};

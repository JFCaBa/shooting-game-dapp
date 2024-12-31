
export type LocationData = {
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
  };
  
  export type Player = {
    id: string;
    location: LocationData;
    heading: number;
  };
  
  export type ShootData = {
    shotId?: string;
    hitPlayerId?: string;
    damage: number;
    distance: number;
    deviation: number;
    heading: number;
    location?: LocationData;
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
    ANNOUNCED = 'announced'
  }
  
  export type GameMessage = {
    type: MessageType;
    playerId: string;
    data: {
      player?: Player;
      shoot?: ShootData;
    };
    senderId?: string;
    pushToken?: string;
  };
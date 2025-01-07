type GameScoreAction = {
  type: 'HIT' | 'KILL' | 'DRONE_HIT' | 'GEO_OBJECT_HIT';
  droneId?: string;
  playerId?: string;
  geoObjectId?: string;
};

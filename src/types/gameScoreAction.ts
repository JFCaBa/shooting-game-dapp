type GameScoreAction = {
  type: 'HIT' | 'KILL' | 'DRONE_HIT' | 'GEO_OBJECT_HIT' | 'RESET_DRONES';
  droneId?: string;
  playerId?: string;
  geoObjectId?: string;
};

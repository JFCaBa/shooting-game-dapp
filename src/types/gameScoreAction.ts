type GameScoreAction = {
  type: 'HIT' | 'KILL' | 'DRONE_HIT';
  droneId?: string;
  playerId?: string;
};

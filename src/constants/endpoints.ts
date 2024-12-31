// require('dotenv').config();

const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.shooting-game.com';
const WS_URL = process.env.REACT_APP_WS_URL || 'wss://api.shooting-game.com';

export const API_ENDPOINTS = {
  // Player related endpoints
  PLAYERS: `${BASE_URL}/api/v1/players`,
  PLAYER_TOKENS: (address: string) => `${BASE_URL}/api/v1/players/${address}/tokens`,
  PLAYER_ACHIEVEMENTS: (address: string) => `${BASE_URL}/api/v1/players/${address}/achievements`,
  
  // Game related endpoints
  HALL_OF_FAME: `${BASE_URL}/api/v1/halloffame/kills`,
  AD_REWARD: `${BASE_URL}/api/v1/players/adReward`,
  
  // WebSocket endpoint
  WEBSOCKET: WS_URL
};
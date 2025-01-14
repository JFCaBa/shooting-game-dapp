// src/constants/endpoints.ts

const BASE_URL = process.env.REACT_APP_API_URL;
const WS_URL = process.env.REACT_APP_WS_URL;

export const API_ENDPOINTS = {
  // Player related endpoints
  PLAYERS: `${BASE_URL}/api/v1/players`,
  PLAYERS_PROFILE: (address: string) =>
    `${BASE_URL}/api/v1/players/${address}/details`,
  PLAYER_TOKENS: (address: string) =>
    `${BASE_URL}/api/v1/players/${address}/tokens`,
  PLAYER_ACHIEVEMENTS: (address: string) =>
    `${BASE_URL}/api/v1/players/${address}/achievements`,
  PLAYER_UPDATE_DETAILS: `${BASE_URL}/api/v1/players/updatePlayerDetails`,
  PLAYER_UPDATE_PASSWORD: `${BASE_URL}/api/v1/players/updatePassword`,
  INVENTORY: (playerId: string) =>
    `${BASE_URL}/api/v1/players/${playerId}/inventory`,

  // Game related endpoints
  HALL_OF_FAME: `${BASE_URL}/api/v1/halloffame/kills`,
  AD_REWARD: `${BASE_URL}/api/v1/players/adReward`,
  GEO_OBJECTS: `${BASE_URL}/api/v1/players/geoobjects`,

  // WebSocket endpoint with correct port
  WEBSOCKET:
    process.env.NODE_ENV === 'production'
      ? 'wss://api.shootingdapp.com:8182'
      : WS_URL,
};

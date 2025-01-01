// src/constants/endpoints.ts

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8182';

export const API_ENDPOINTS = {
  // Player related endpoints
  PLAYERS: `${BASE_URL}/api/v1/players`,
  PLAYER_TOKENS: (address: string) => `${BASE_URL}/api/v1/players/${address}/tokens`,
  PLAYER_ACHIEVEMENTS: (address: string) => `${BASE_URL}/api/v1/players/${address}/achievements`,
  
  // Game related endpoints
  HALL_OF_FAME: `${BASE_URL}/api/v1/halloffame/kills`,
  AD_REWARD: `${BASE_URL}/api/v1/players/adReward`,
  
  // WebSocket endpoint with correct port
  WEBSOCKET: process.env.NODE_ENV === 'production' 
    ? 'wss://api.shootingdapp.com:8182'
    : WS_URL
};
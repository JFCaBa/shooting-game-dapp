// src/services/PlayerService.ts
// Handles player data and interactions

import { API_ENDPOINTS } from '../constants/endpoints';
import { Player, LocationData } from '../types/game';

export class PlayerService {
  private static instance: PlayerService;

  private constructor() {}

  static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  async updatePlayerLocation(playerId: string, location: LocationData, heading: number): Promise<void> {
    try {
      const response = await fetch(`${API_ENDPOINTS.PLAYERS}/${playerId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, heading }),
      });

      if (!response.ok) {
        throw new Error('Failed to update player location');
      }
    } catch (error) {
      console.error('Error updating player location:', error);
      throw error;
    }
  }

  async getNearbyPlayers(playerId: string, radius: number): Promise<Player[]> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.PLAYERS}/${playerId}/nearby?radius=${radius}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby players');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby players:', error);
      throw error;
    }
  }
}
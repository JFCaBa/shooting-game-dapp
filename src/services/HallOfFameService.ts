// src/services/HallOfFameService.ts

import { HallOfFameResponse } from '../types/hallOfFame';
import { API_ENDPOINTS } from '../constants/endpoints';

export class HallOfFameService {
  private static instance: HallOfFameService;

  private constructor() {}

  public static getInstance(): HallOfFameService {
    if (!HallOfFameService.instance) {
      HallOfFameService.instance = new HallOfFameService();
    }
    return HallOfFameService.instance;
  }

  async getTopPlayers(): Promise<HallOfFameResponse> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_ENDPOINTS.HALL_OF_FAME}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hall of fame data');
      }

      const data: HallOfFameResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching hall of fame:', error);
      throw error;
    }
  }
}

export const hallOfFameService = HallOfFameService.getInstance();

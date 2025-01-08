// src/services/AchievementService.ts

import { Achievement, AchievementResponse } from '../types/achievement';
import { API_ENDPOINTS } from '../constants/endpoints';

export class AchievementService {
  private static instance: AchievementService;

  private constructor() {}

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  async getPlayerAchievements(playerId: string): Promise<Achievement[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(
        `${API_ENDPOINTS.PLAYERS}/${playerId}/achievements`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const data: AchievementResponse[] = await response.json();

      return data.map((achievement) => ({
        id: achievement._id,
        type: achievement.type.toLowerCase() as Achievement['type'],
        milestone: achievement.milestone,
        progress: achievement.milestone, // Since it's unlocked, progress equals milestone
        playerId: achievement.playerId,
        unlockedAt: achievement.unlockedAt,
        reward: achievement.reward,
      }));
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  }
}

export const achievementService = AchievementService.getInstance();

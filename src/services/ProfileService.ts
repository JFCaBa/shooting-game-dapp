// src/services/ProfileService.ts

import { ProfileResponse } from '../types/profile';
import { API_ENDPOINTS } from '../constants/endpoints';

export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  async getProfile(playerId: string): Promise<ProfileResponse> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(
        `${API_ENDPOINTS.PLAYERS_PROFILE(playerId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data: ProfileResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Profile:', error);
      throw error;
    }
  }

  async updateDetails(playerId: string, nickname: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_ENDPOINTS.PLAYER_UPDATE_DETAILS}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId,
          userData: {
            details: {
              nickname: nickname,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update details');
      }

      const data: ProfileResponse = await response.json();
      return;
    } catch (error) {
      console.error('Error updating details:', error);
      throw error;
    }
  }

  async updatePassword(
    playerId: string,
    currentPassword: string,
    newPassword: string
  ) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_ENDPOINTS.PLAYER_UPDATE_PASSWORD}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId,
          userData: {
            details: {
              password: newPassword,
            },
          },
          currentPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      const data: ProfileResponse = await response.json();
      return;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

export const hallOfFameService = ProfileService.getInstance();

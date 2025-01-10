// src/services/InventoryService.ts

import { API_ENDPOINTS } from '../constants/endpoints';
import {
  InventoryItem,
  UseItemResponse,
  FetchInventoryResponse,
} from '../types/inventory';

export class InventoryService {
  private static instance: InventoryService;

  private constructor() {}

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  async fetchInventory(playerId: string): Promise<FetchInventoryResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.PLAYERS}/${playerId}/inventory`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  async useItem(playerId: string, itemId: string): Promise<UseItemResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.PLAYERS}/${playerId}/inventory/use/${itemId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to use item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error using item:', error);
      throw error;
    }
  }

  async fetchGeoObjects(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<InventoryItem[]> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.GEO_OBJECTS}/list?lat=${latitude}&lng=${longitude}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch geo objects');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching geo objects:', error);
      throw error;
    }
  }
}

export const inventoryService = InventoryService.getInstance();

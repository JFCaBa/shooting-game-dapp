import { API_ENDPOINTS } from '../constants/endpoints';
import { Inventory, InventoryItem } from '../types/inventory';

export class InventoryService {
  private static instance: InventoryService;

  private constructor() {}

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  async fetchInventory(playerId: string): Promise<InventoryItem[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(API_ENDPOINTS.INVENTORY(playerId), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data: Inventory = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  async useItem(playerId: string, itemId: string): Promise<InventoryItem> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_ENDPOINTS.PLAYERS}/${playerId}/inventory/use/${itemId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
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
}

export const inventoryService = InventoryService.getInstance();

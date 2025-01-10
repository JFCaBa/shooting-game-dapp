// src/types/inventory.ts

export type InventoryItemType = 'ammo' | 'health' | 'powerup' | 'collectible';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: InventoryItemType;
  imageUrl: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface InventoryState {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
}

export interface UseItemResponse {
  success: boolean;
  message?: string;
  updatedQuantity?: number;
}

export interface FetchInventoryResponse {
  items: InventoryItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

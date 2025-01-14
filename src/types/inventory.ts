export interface InventoryItem {
  itemId: string;
  type: 'weapon' | 'target' | 'powerup';
  metadata: Map<string, any>;
  collectedAt: string;
  used: boolean;
  usedAt?: string;
}

export interface Inventory {
  playerId: string;
  items: InventoryItem[];
  lastUpdated: string;
}

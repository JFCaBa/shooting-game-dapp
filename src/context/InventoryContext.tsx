// src/contexts/InventoryContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem } from '../types/inventory';
import { inventoryService } from '../services/InventoryService';
import { useGameContext } from './GameContext';

interface InventoryContextType {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  updateInventory: (items: InventoryItem[]) => void;
  handleUseItem: (itemId: string) => Promise<void>;
  fetchItems: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { playerId } = useGameContext();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!playerId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fetchedInventory = await inventoryService.fetchInventory(playerId);
      setItems(fetchedInventory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching inventory');
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [playerId]);

  const updateInventory = (newItems: InventoryItem[]) => {
    setItems(newItems);
  };

  const handleUseItem = async (itemId: string) => {
    if (!playerId) return;

    try {
      setError(null);
      const usedItem = await inventoryService.useItem(playerId, itemId);

      // Update the items list to mark the item as used
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.itemId === itemId
            ? {
                ...item,
                used: true,
                usedAt: usedItem.usedAt,
              }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use item');
      console.error('Error using item:', err);
      throw err;
    }
  };

  const value = {
    items,
    isLoading,
    error,
    updateInventory,
    handleUseItem,
    fetchItems,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

// src/pages/Inventory.tsx
import React, { useCallback } from 'react';
import { Package } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

const Inventory = () => {
  const { items, isLoading, error, handleUseItem } = useInventory();

  const onUseItem = useCallback(
    async (itemId: string) => {
      try {
        await handleUseItem(itemId);
      } catch (err) {
        console.error('Failed to use item:', err);
      }
    },
    [handleUseItem]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-game-dark text-white p-4 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-game-dark text-white p-4 flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-game-dark">
      <div className="flex-1 overflow-y-auto pb-[170px]">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="w-6 h-6 text-game-primary" />
            <h1 className="text-2xl font-bold text-white">Inventory</h1>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-20">
              <Package className="w-16 h-16 mb-4" />
              <p className="text-lg">
                Your inventory is empty.
                <br />
                Collect items by shooting special targets!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.itemId}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-game-primary text-2xl capitalize">
                        {item.type.charAt(0)}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-medium capitalize">
                        {item.type}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Collected:{' '}
                        {new Date(item.collectedAt).toLocaleDateString()}
                      </p>
                      {item.metadata && (
                        <p className="text-gray-400 text-sm">
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <span key={key}>
                              {key}: {value.toString()}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onUseItem(item.itemId)}
                    className="px-4 py-2 bg-game-primary rounded-lg hover:bg-opacity-80 
                             transition-colors text-white disabled:opacity-50 
                             disabled:cursor-not-allowed"
                    disabled={item.used}
                  >
                    {item.used ? 'USED' : 'USE'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;

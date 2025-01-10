import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: 'ammo' | 'health' | 'powerup';
  imageUrl: string;
}

// Temporary mock data until API is ready
const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Standard Ammunition',
    quantity: 120,
    type: 'ammo',
    imageUrl: '/assets/ammo_icon.png',
  },
  {
    id: '2',
    name: 'Health Pack',
    quantity: 3,
    type: 'health',
    imageUrl: '/assets/health_icon.png',
  },
];

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // TODO: Replace with actual API call when ready
        // const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/players/inventory`);
        // const data = await response.json();
        // setInventory(data);

        // Using mock data for now
        setTimeout(() => {
          setInventory(mockInventory);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Failed to load inventory');
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleUse = async (itemId: string) => {
    try {
      // TODO: Implement use item API call
      console.log('Using item:', itemId);
      // const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/players/inventory/use/${itemId}`, {
      //   method: 'POST'
      // });
      // Update local state after successful use
    } catch (err) {
      console.error('Error using item:', err);
    }
  };

  if (loading) {
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
      {/* Scrollable container with padding bottom for navigation */}
      <div className="flex-1 overflow-y-auto pb-[170px]">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-6">
            <Package className="w-6 h-6 text-game-primary" />
            <h1 className="text-2xl font-bold text-white">Inventory</h1>
          </div>

          {inventory.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-20">
              <Package className="w-16 h-16 mb-4" />
              <p className="text-lg">
                Your inventory is empty.
                <br />
                Collect items by shooting special targets!
              </p>
            </div>
          ) : (
            // Inventory items list
            <div className="space-y-4">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    {/* Item image/icon */}
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-8 h-8"
                        onError={(e) => {
                          // Fallback icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/default_icon.png';
                        }}
                      />
                    </div>

                    {/* Item details */}
                    <div>
                      <h3 className="text-white font-medium">{item.name}</h3>
                      <p className="text-gray-400 text-sm">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>

                  {/* Use button */}
                  <button
                    onClick={() => handleUse(item.id)}
                    className="px-4 py-2 bg-game-primary rounded-lg hover:bg-opacity-80 transition-colors text-white"
                    disabled={item.quantity <= 0}
                  >
                    USE
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

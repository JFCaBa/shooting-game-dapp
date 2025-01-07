import React, { useRef, useEffect } from 'react';

const Inventory = () => {
  const InventoryContainerRef = useRef<HTMLDivElement | null>(null);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
  };

  useEffect(() => {
    const fetchInventory = async () => {};
    fetchInventory();
  }, []);

  return (
    <div id="inventory" ref={InventoryContainerRef} style={containerStyle}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
        <div className="text-center mt-1/3">
          <h2 className="text-2xl font-bold mb-4">Coming Soon!</h2>
          <p className="text-white-600 mb-6">
            This feature is currently under development and will be available
            soon. Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inventory;

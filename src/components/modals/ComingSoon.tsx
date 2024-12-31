import React from 'react';

interface ComingSoonProps {
  onClose: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Coming Soon!</h2>
          <p className="text-gray-600 mb-6">
            This feature is currently under development and will be available soon.
            Stay tuned for updates!
          </p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
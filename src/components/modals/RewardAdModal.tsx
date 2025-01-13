import React from 'react';
import { adService } from '../../services/AdService';

interface RewardAdModalProps {
  type: 'ammo' | 'lives';
  onClose: () => void;
  onReward: () => void;
}

const RewardAdModal = ({ type, onClose, onReward }: RewardAdModalProps) => {
  const handleWatchAd = async () => {
    console.log('Watch Ad clicked');
    const success = await adService.showRewardedAd();
    if (success) {
      console.log('Ad completed successfully');
      onClose();
    }
  };

  const handleNoThanks = () => {
    console.log('No Thanks clicked');
    // Make sure we're actually calling onClose
    if (onClose) {
      onClose();
      console.log('onClose called from No Thanks handler');
    } else {
      console.warn('onClose is not defined');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-game-dark border-2 border-game-primary rounded-lg p-6 max-w-md mx-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          {type === 'ammo' ? 'Out of Ammo!' : 'Out of Lives!'}
        </h2>
        <p className="text-gray-300 mb-6">
          {type === 'ammo'
            ? 'Watch a short ad to instantly reload your weapon!'
            : 'Watch a short ad to instantly respawn!'}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleWatchAd}
            className="px-6 py-2 bg-game-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Watch Ad
          </button>
          <button
            onClick={handleNoThanks}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            No Thanks
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardAdModal;

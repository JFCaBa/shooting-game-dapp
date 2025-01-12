import React, { useEffect, useState } from 'react';
import { adService, AdNetwork } from '../../services/AdService';

interface RewardAdProps {
  type: 'ammo' | 'lives';
  onClose: () => void;
  onReward: () => void;
}

const RewardAd: React.FC<RewardAdProps> = ({ type, onClose, onReward }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<AdNetwork | null>(null);

  useEffect(() => {
    const initializeAds = async () => {
      try {
        await adService.initialize([
          {
            network: 'unity',
            appId: process.env.REACT_APP_UNITY_APP_ID || '',
            placementId: process.env.REACT_APP_UNITY_PLACEMENT_ID || '',
            testMode: process.env.NODE_ENV !== 'production',
          },
          {
            network: 'ironsource',
            appId: process.env.REACT_APP_IRONSOURCE_APP_ID || '',
            testMode: process.env.NODE_ENV !== 'production',
          },
          {
            network: 'applovin',
            appId: process.env.REACT_APP_APPLOVIN_APP_ID || '',
            testMode: process.env.NODE_ENV !== 'production',
          },
        ]);
        setCurrentNetwork(adService.getCurrentNetwork());
      } catch (error) {
        console.error('Failed to initialize ad networks:', error);
      }
    };

    initializeAds();
  }, []);

  const handleWatchAd = async () => {
    if (!adService.isSupported()) {
      console.error('Ad service not supported');
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const success = await adService.showRewardedAd();
      if (success) {
        onReward();
      }
      onClose();
    } catch (error) {
      console.error('Error showing ad:', error);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-game-dark border-2 border-game-primary rounded-lg p-6 max-w-md mx-4">
        <h2 className="text-2xl font-bold text-white mb-4">
          {type === 'ammo' ? 'Out of Ammo!' : 'Out of Lives!'}
        </h2>

        <p className="text-gray-300 mb-6">
          {type === 'ammo'
            ? 'Watch a short ad to instantly reload your weapon!'
            : 'Watch a short ad to instantly respawn!'}
        </p>

        {currentNetwork && (
          <p className="text-sm text-gray-400 mb-4">
            Ad provided by{' '}
            {currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)}
          </p>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleWatchAd}
            disabled={isLoading || !adService.isSupported()}
            className="px-6 py-2 bg-game-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Watch Ad'}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            No Thanks
          </button>
        </div>

        {!adService.isSupported() && (
          <p className="text-sm text-red-500 mt-4">
            Ad service temporarily unavailable. Please try again later.
          </p>
        )}
      </div>
    </div>
  );
};

export default RewardAd;

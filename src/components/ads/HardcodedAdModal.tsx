import React, { useEffect, useState } from 'react';
import { hardcodedAdService } from '../../services/HardcodedAdService';

interface HardcodedAdModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

const HardcodedAdModal = ({ onComplete, onSkip }: HardcodedAdModalProps) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [ad] = useState(
    () =>
      hardcodedAdService.getAds()[
        Math.floor(Math.random() * hardcodedAdService.getAds().length)
      ]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  const handleImageClick = () => {
    window.open(ad.targetUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 relative">
        <div className="absolute top-2 right-4 text-2xl font-bold text-gray-600">
          {timeLeft}s
        </div>

        <img
          src={ad.imageUrl}
          alt="Advertisement"
          className="w-full h-auto cursor-pointer transition-transform hover:scale-105"
          onClick={handleImageClick}
        />

        <p className="mt-2 text-sm text-gray-500 text-center">
          Click the image to learn more
        </p>
      </div>
    </div>
  );
};

export default HardcodedAdModal;

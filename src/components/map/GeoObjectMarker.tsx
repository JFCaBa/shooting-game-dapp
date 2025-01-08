import React from 'react';
import { GeoObject } from '../../types/game';
import { Box, Trophy, Gift } from 'lucide-react';

interface GeoObjectMarkerProps {
  geoObject: GeoObject;
  onClick?: () => void;
}

const GeoObjectMarker: React.FC<GeoObjectMarkerProps> = ({
  geoObject,
  onClick,
}) => {
  const getIcon = () => {
    switch (geoObject.type) {
      case 'reward':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'powerup':
        return <Gift className="w-6 h-6 text-blue-500" />;
      default:
        return <Box className="w-6 h-6 text-purple-500" />;
    }
  };

  return (
    <div
      className="cursor-pointer transform hover:scale-110 transition-transform"
      onClick={onClick}
    >
      <div className="relative">
        {getIcon()}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
          {geoObject.metadata.name || geoObject.type}
        </div>
      </div>
    </div>
  );
};

export default GeoObjectMarker;

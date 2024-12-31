// src/components/map/PlayerAnnotation.tsx
// No route - Map component
// Custom marker component for players on the map

import React from 'react';
import { Marker } from '@react-google-maps/api';
import { Player } from '../../types/game';

interface PlayerAnnotationProps {
  player: Player;
  position: google.maps.LatLngLiteral;
}

const PlayerAnnotation: React.FC<PlayerAnnotationProps> = ({ player, position }) => {
  return (
    <Marker
      position={position}
      icon={{
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#FF5252',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
        rotation: player.heading // Use player's heading for marker rotation
      }}
      title={player.id}
    />
  );
};

export default PlayerAnnotation;
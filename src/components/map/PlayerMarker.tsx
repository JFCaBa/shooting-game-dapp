import React from 'react';
import { Player } from '../../types/game';

interface PlayerMarkerProps {
  player: Player;
  isCurrentPlayer?: boolean;
}

const PlayerMarker: React.FC<PlayerMarkerProps> = ({
  player,
  isCurrentPlayer = false,
}) => {
  return (
    <div className="relative">
      {/* Outer circle */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center relative transform transition-transform duration-300 ${
          isCurrentPlayer ? 'bg-game-primary' : 'bg-game-secondary'
        }`}
      >
        {/* Inner circle */}
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
          {/* Direction indicator - using a simple triangle with borders */}
          <div
            style={{
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '12px solid black',
              transform: `rotate(${player.heading}deg)`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      </div>

      {/* Player nickname or ID */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            textShadow: '1px 1px 1px rgba(0, 0, 0, 0.5)',
          }}
        >
          {player.playerId.slice(0, 8)}
        </span>
      </div>
    </div>
  );
};

export default PlayerMarker;

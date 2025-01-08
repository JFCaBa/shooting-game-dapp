// src/components/hallOfFame/HallOfFamePlayerCard.tsx

import React from 'react';
import { HallOfFamePlayer } from '../../types/hallOfFame';
import { Cpu, Target, Crosshair } from 'lucide-react';

interface HallOfFamePlayerCardProps {
  player: HallOfFamePlayer;
  rank: number;
}

const HallOfFamePlayerCard: React.FC<HallOfFamePlayerCardProps> = ({
  player,
  rank,
}) => {
  const { stats, nickname } = player;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-2">
      <div className="flex items-center space-x-4">
        {/* Rank and Avatar */}
        <div className="flex-shrink-0 w-12 h-12 bg-game-primary rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-bold">#{rank + 1}</span>
        </div>

        {/* Player Info */}
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-white">
            {nickname || 'Anonymous Player'}
          </h3>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {/* Kills */}
            <div className="flex items-center space-x-1">
              <Crosshair className="w-4 h-4 text-red-500" />
              <span className="text-gray-300">{stats.kills}</span>
            </div>

            {/* Hits */}
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-gray-300">{stats.hits}</span>
            </div>

            {/* Drone Hits */}
            {stats.droneHits !== undefined && (
              <div className="flex items-center space-x-1">
                <Cpu className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-300">{stats.droneHits}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallOfFamePlayerCard;

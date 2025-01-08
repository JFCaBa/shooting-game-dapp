// src/pages/HallOfFame.tsx

import React, { useState, useEffect } from 'react';
import { hallOfFameService } from '../services/HallOfFameService';
import { HallOfFamePlayer } from '../types/hallOfFame';
import HallOfFamePlayerCard from '../components/hallOfFame/HallOfFamePlayerCard';
import { Trophy } from 'lucide-react';

const HallOfFame: React.FC = () => {
  const [players, setPlayers] = useState<HallOfFamePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPlayers();
  }, []);

  const fetchTopPlayers = async () => {
    try {
      const data = await hallOfFameService.getTopPlayers();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching top players:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-game-dark text-white p-4 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-game-dark">
      {/* Scrollable container with padding bottom for navigation */}
      <div className="flex-1 overflow-y-auto pb-[170px]">
        <div className="p-4">
          {/* Header */}
          <h1 className="text-2xl font-bold text-white mb-6">Hall of Fame</h1>

          {players.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-20">
              <Trophy className="w-16 h-16 mb-4" />
              <p className="text-lg">
                No players in the Hall of Fame yet.
                <br />
                Keep playing to be the first!
              </p>
            </div>
          ) : (
            // Player list
            <div className="space-y-4">
              {players.map((player, index) => (
                <HallOfFamePlayerCard
                  key={player._id}
                  player={player}
                  rank={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HallOfFame;

// src/pages/Achievements.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AchievementCard from '../components/achievements/AchievementCard';
import { useAchievements } from '../context/AchievementsContext';

const Achievements: React.FC = () => {
  const navigate = useNavigate();
  const { achievements, displayAchievements, loading } = useAchievements();

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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <button
              onClick={() => navigate('/hallOfFame')}
              className="px-4 py-2 bg-game-primary rounded-lg hover:bg-opacity-80 text-white"
            >
              Hall of Fame
            </button>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                earned={achievements.some((a) => a.id === achievement.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;

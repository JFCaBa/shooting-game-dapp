// src/components/achievements/AchievementCard.tsx

import React from 'react';
import { Achievement, AchievementType } from '../../types/achievement';
import { Trophy, Target, Clock, Crosshair } from 'lucide-react';

interface AchievementCardProps {
  achievement: Achievement;
  earned: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  earned,
}) => {
  const getAchievementIcon = (type: AchievementType) => {
    switch (type) {
      case AchievementType.KILLS:
        return <Crosshair className="w-8 h-8" />;
      case AchievementType.HITS:
        return <Target className="w-8 h-8" />;
      case AchievementType.ACCURACY:
        return <Trophy className="w-8 h-8" />;
      case AchievementType.SURVIVAL_TIME:
        return <Clock className="w-8 h-8" />;
    }
  };

  const getAchievementTitle = (type: AchievementType, milestone: number) => {
    switch (type) {
      case AchievementType.KILLS:
        return `${milestone} Kills`;
      case AchievementType.HITS:
        return `${milestone} Hits`;
      case AchievementType.ACCURACY:
        return `${milestone}% Accuracy`;
      case AchievementType.SURVIVAL_TIME:
        const hours = Math.floor(milestone / 3600);
        return `Survive ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
  };

  const getAchievementDescription = (
    type: AchievementType,
    milestone: number
  ) => {
    switch (type) {
      case AchievementType.KILLS:
        return `Eliminate ${milestone} players`;
      case AchievementType.HITS:
        return `Successfully hit ${milestone} shots`;
      case AchievementType.ACCURACY:
        return `Maintain ${milestone}% accuracy`;
      case AchievementType.SURVIVAL_TIME:
        const hours = Math.floor(milestone / 3600);
        return `Stay alive for ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
  };

  return (
    <div
      className={`relative p-4 rounded-lg ${
        earned ? 'bg-game-primary bg-opacity-20' : 'bg-gray-800'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div
          className={`p-3 rounded-full ${
            earned ? 'bg-game-primary' : 'bg-gray-700'
          }`}
        >
          {getAchievementIcon(achievement.type)}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            {getAchievementTitle(achievement.type, achievement.milestone)}
          </h3>
          <p className="text-gray-400">
            {getAchievementDescription(achievement.type, achievement.milestone)}
          </p>

          {earned ? (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-green-500">Unlocked</span>
              {achievement.reward && (
                <span className="text-yellow-500">
                  +{achievement.reward} TOKENS
                </span>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-game-primary transition-all duration-300"
                  style={{
                    width: `${
                      (achievement.progress / achievement.milestone) * 100
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-400 mt-1">
                {achievement.progress} / {achievement.milestone}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;

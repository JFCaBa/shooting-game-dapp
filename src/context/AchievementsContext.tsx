// src/context/AchievementsContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Achievement, achievementPlaceholders } from '../types/achievement';
import { achievementService } from '../services/AchievementService';
import { useGameContext } from './GameContext';

interface AchievementsContextType {
  achievements: Achievement[];
  displayAchievements: Achievement[];
  updateAchievements: (achievements: Achievement[]) => void;
  loading: boolean;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(
  undefined
);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { playerId } = useGameContext();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [displayAchievements, setDisplayAchievements] = useState(
    achievementPlaceholders
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!playerId) {
        setLoading(false);
        return;
      }

      try {
        const fetchedAchievements =
          await achievementService.getPlayerAchievements(playerId);
        updateAchievements(fetchedAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [playerId]);

  const updateAchievements = (newAchievements: Achievement[]) => {
    setAchievements(newAchievements);

    // Update display achievements with unlocked ones
    const updatedDisplayAchievements = achievementPlaceholders.map(
      (placeholder) => {
        const unlockedAchievement = newAchievements.find(
          (achievement) =>
            achievement.type === placeholder.type &&
            achievement.milestone === placeholder.milestone
        );
        return unlockedAchievement || placeholder;
      }
    );

    setDisplayAchievements(updatedDisplayAchievements);
  };

  const value = {
    achievements,
    displayAchievements,
    updateAchievements,
    loading,
  };

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error(
      'useAchievements must be used within an AchievementsProvider'
    );
  }
  return context;
};

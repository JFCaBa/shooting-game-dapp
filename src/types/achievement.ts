// src/types/achievement.ts

export enum AchievementType {
  KILLS = 'kills',
  HITS = 'hits',
  ACCURACY = 'accuracy',
  SURVIVAL_TIME = 'survivalTime',
}

export interface Achievement {
  id: string;
  type: AchievementType;
  milestone: number;
  progress: number;
  playerId: string;
  unlockedAt: string | null;
  nftTokenId?: string | null;
  reward?: number;
}

export interface AchievementResponse {
  _id: string;
  playerId: string;
  type: string;
  milestone: number;
  unlockedAt: string;
  __v: number;
  reward?: number;
}

export const achievementPlaceholders: Achievement[] = [
  // Kills achievements
  {
    id: 'kills_10',
    type: AchievementType.KILLS,
    milestone: 10,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'kills_50',
    type: AchievementType.KILLS,
    milestone: 50,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'kills_100',
    type: AchievementType.KILLS,
    milestone: 100,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'kills_500',
    type: AchievementType.KILLS,
    milestone: 500,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'kills_1000',
    type: AchievementType.KILLS,
    milestone: 1000,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },

  // Hits achievements
  {
    id: 'hits_100',
    type: AchievementType.HITS,
    milestone: 100,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'hits_500',
    type: AchievementType.HITS,
    milestone: 500,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'hits_1000',
    type: AchievementType.HITS,
    milestone: 1000,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'hits_5000',
    type: AchievementType.HITS,
    milestone: 5000,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },

  // Accuracy achievements
  {
    id: 'accuracy_50',
    type: AchievementType.ACCURACY,
    milestone: 50,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'accuracy_75',
    type: AchievementType.ACCURACY,
    milestone: 75,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'accuracy_90',
    type: AchievementType.ACCURACY,
    milestone: 90,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'accuracy_95',
    type: AchievementType.ACCURACY,
    milestone: 95,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },

  // Survival time achievements (in seconds)
  {
    id: 'survival_3600',
    type: AchievementType.SURVIVAL_TIME,
    milestone: 3600,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'survival_18000',
    type: AchievementType.SURVIVAL_TIME,
    milestone: 18000,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
  {
    id: 'survival_86400',
    type: AchievementType.SURVIVAL_TIME,
    milestone: 86400,
    progress: 0,
    playerId: '',
    unlockedAt: null,
  },
];

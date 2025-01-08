// src/types/hallOfFame.ts

export interface Stats {
  hits: number;
  kills: number;
  droneHits?: number;
}

export interface HallOfFamePlayer {
  stats: Stats;
  _id: string;
  playerId?: string;
  nickname?: string;
}

export type HallOfFameResponse = HallOfFamePlayer[];

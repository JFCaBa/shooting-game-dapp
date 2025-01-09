import { Location } from './location'; // Replace with your actual location type if applicable

export interface PlayerStats {
  kills: number;
  hits: number;
  deaths: number;
  droneHits: number;
  survivalStart: Date | null;
  accuracy: number;
  shoots: number;
  currentLives: number;
  currentAmmo: number;
}

export interface Player {
  playerId: string; // Always required
  kind?: string; // Defaults to 'player'
  walletAddress?: string | null;
  nickname?: string | null;
  passwordHash?: string | null;
  passwordSalt?: string | null;
  email?: string | null;
  pushToken?: string | null;
  pushTokenUpdatedAt?: Date | null;
  stats: PlayerStats; // Nested stats object
  lastActive: Date; // Defaults to current date
  mintedBalance: number; // Defaults to 0
  pendingBalance: number; // Defaults to 0
  lastUpdate: Date; // Defaults to current date
  location?: Location; // Replace `Location` with your actual type
}

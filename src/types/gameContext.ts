import { DroneData, GeoObject, Player, GameScore, LocationData } from './game';

export type AdModalType = 'ammo' | 'lives' | null;

export interface GameState {
  players: Player[];
  drones: DroneData[];
  gameScore: GameScore;
  playerId: string | null;
  isAlive: boolean;
  currentLives: number;
  maxLives: number;
  currentAmmo: number;
  maxAmmo: number;
  isReloading: boolean;
  droneTimer: NodeJS.Timer | null;
  geoObjects: GeoObject[];
  location: LocationData;
  heading: number;
  pushToken: null;
  showAdModal: AdModalType;
}

export interface GameContextType extends GameState {
  geoObjects: GeoObject[];
  setGeoObjects: (objects: GeoObject[]) => void;
  shoot: (location: LocationData, heading: number) => void;
  reload: () => void;
  startGame: () => void;
  endGame: () => void;
  updateGameScore: (action: GameScoreAction) => void;
  handleAdReward: () => void;
  closeAdModal: () => void;
}

export const INITIAL_STATE: GameState = {
  players: [],
  drones: [],
  gameScore: { hits: 0, kills: 0 },
  playerId: null,
  isAlive: true,
  currentLives: 0,
  maxLives: 10,
  currentAmmo: 0,
  maxAmmo: 30,
  isReloading: false,
  droneTimer: null,
  geoObjects: [],
  location: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0 },
  heading: 0,
  pushToken: null,
  showAdModal: null,
};

export const RELOAD_TIME = 3000;
export const RESPAWN_TIME = 60000;
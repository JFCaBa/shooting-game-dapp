export interface Bullet {
  bulletId: string;
  playerId: string;
  used: boolean;
  timestamp: Date;
  metadata?: {
    type: 'regular' | 'special';
    damage: number;
  };
}

export interface BulletValidation {
  isValid: boolean;
  bulletId: string;
  playerId: string;
  error?: string;
}

export type BulletType = 'regular' | 'special';

export interface BulletMetadata {
  type: BulletType;
  damage: number;
}

export interface BulletStats {
  availableBullets: number;
  totalBullets: number;
  usedBullets: number;
  lastReloadTime: Date | null;
}

export type BulletReloadStatus = {
  success: boolean;
  newBullets?: Bullet[];
  error?: string;
  cooldownRemaining?: number;
};

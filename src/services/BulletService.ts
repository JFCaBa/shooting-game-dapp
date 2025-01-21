import { create } from 'zustand';

interface Bullet {
  bulletId: string;
  used: boolean;
  timestamp: Date;
}

interface BulletState {
  bullets: Bullet[];
  availableBulletCount: number;
  lastShotTime: number;
}

interface BulletActions {
  setBullets: (bullets: Bullet[]) => void;
  consumeBullet: () => string | null;
  markBulletAsUsed: (bulletId: string) => void;
  canShoot: () => boolean;
}

const SHOOT_COOLDOWN = 500; // 500ms between shots

export const useBulletStore = create<BulletState & BulletActions>(
  (set, get) => ({
    bullets: [],
    availableBulletCount: 0,
    lastShotTime: 0,

    setBullets: (bullets) => {
      set({
        bullets,
        availableBulletCount: bullets.filter((b) => !b.used).length,
      });
    },

    consumeBullet: () => {
      const { bullets, lastShotTime } = get();
      const now = Date.now();

      // Check cooldown
      if (now - lastShotTime < SHOOT_COOLDOWN) {
        return null;
      }

      const availableBullet = bullets.find((bullet) => !bullet.used);
      if (!availableBullet) {
        return null;
      }

      set((state) => ({
        bullets: state.bullets.map((bullet) =>
          bullet.bulletId === availableBullet.bulletId
            ? { ...bullet, used: true }
            : bullet
        ),
        availableBulletCount: state.availableBulletCount - 1,
        lastShotTime: now,
      }));

      return availableBullet.bulletId;
    },

    markBulletAsUsed: (bulletId) => {
      set((state) => ({
        bullets: state.bullets.map((bullet) =>
          bullet.bulletId === bulletId ? { ...bullet, used: true } : bullet
        ),
        availableBulletCount: state.bullets.filter(
          (b) => !b.used && b.bulletId !== bulletId
        ).length,
      }));
    },

    canShoot: () => {
      const { availableBulletCount, lastShotTime } = get();
      const now = Date.now();
      return availableBulletCount > 0 && now - lastShotTime >= SHOOT_COOLDOWN;
    },
  })
);

class BulletService {
  private static instance: BulletService;
  private bulletStore = useBulletStore;

  private constructor() {}

  public static getInstance(): BulletService {
    if (!BulletService.instance) {
      BulletService.instance = new BulletService();
    }
    return BulletService.instance;
  }

  public setBullets(bullets: Bullet[]) {
    this.bulletStore.getState().setBullets(bullets);
  }

  public canShoot(): boolean {
    return this.bulletStore.getState().canShoot();
  }

  public consumeBullet(): string | null {
    return this.bulletStore.getState().consumeBullet();
  }

  public markBulletAsUsed(bulletId: string): void {
    this.bulletStore.getState().markBulletAsUsed(bulletId);
  }

  public getAvailableBulletCount(): number {
    return this.bulletStore.getState().availableBulletCount;
  }
}

export const bulletService = BulletService.getInstance();
export default bulletService;

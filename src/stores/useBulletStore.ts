import { create } from 'zustand';

interface Bullet {
  bulletId: string;
  used: boolean;
  timestamp: Date;
}

interface BulletStore {
  bullets: Bullet[];
  setBullets: (bullets: Bullet[]) => void;
  addBullets: (newBullets: Bullet[]) => void;
  consumeBullet: () => Bullet | null;
  getAvailableBulletCount: () => number;
  markBulletAsUsed: (bulletId: string) => void;
}

export const useBulletStore = create<BulletStore>((set, get) => ({
  bullets: [],

  setBullets: (bullets) => set({ bullets }),

  addBullets: (newBullets) =>
    set((state) => ({ bullets: [...state.bullets, ...newBullets] })),

  consumeBullet: () => {
    const { bullets } = get();
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
    }));

    return availableBullet;
  },

  getAvailableBulletCount: () => {
    return get().bullets.filter((bullet) => !bullet.used).length;
  },

  markBulletAsUsed: (bulletId) => {
    set((state) => ({
      bullets: state.bullets.map((bullet) =>
        bullet.bulletId === bulletId ? { ...bullet, used: true } : bullet
      ),
    }));
  },
}));

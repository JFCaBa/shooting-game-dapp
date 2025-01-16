// src/services/SoundService.ts

type SoundType = 'shoot' | 'explosion' | 'collect';

interface Sound {
  audio: HTMLAudioElement;
  volume: number;
  pool: HTMLAudioElement[];
  lastPlayedTime: number;
}

export class SoundService {
  private static instance: SoundService;
  private sounds: Map<SoundType, Sound> = new Map();
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private readonly POOL_SIZE = 4;
  private readonly MIN_PLAY_INTERVAL = 50; // ms

  private readonly SOUND_PATHS = {
    shoot: '/assets/shoot_sound.wav',
    explosion: '/assets/explosion_sound.wav',
    collect: '/assets/collect_sound.wav',
  };

  private constructor() {
    this.initializeSounds();
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private async initializeSounds(): Promise<void> {
    try {
      // Create audio context to unlock audio on iOS
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();

      // Unlock audio on user interaction
      const unlockAudio = async () => {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      };

      document.addEventListener('touchstart', unlockAudio);
      document.addEventListener('click', unlockAudio);

      // Preload each sound with a pool of audio elements
      await Promise.all(
        Object.entries(this.SOUND_PATHS).map(async ([type, path]) => {
          const pool: HTMLAudioElement[] = [];

          // Create pool of audio elements
          for (let i = 0; i < this.POOL_SIZE; i++) {
            const audio = new Audio(path);
            audio.preload = 'auto';

            // Important settings for mobile
            audio.setAttribute('playsinline', '');

            // Set preservesPitch if supported by the browser
            if ('preservesPitch' in audio) {
              audio.preservesPitch = false;
            }

            try {
              await audio.load();
              pool.push(audio);
            } catch (error) {
              console.error(`Error loading sound ${type} (${i}):`, error);
            }
          }

          this.sounds.set(type as SoundType, {
            audio: pool[0], // Keep one as main reference
            volume: type === 'explosion' ? 0.6 : 1.0,
            pool,
            lastPlayedTime: 0,
          });
        })
      );

      this.isInitialized = true;
      console.log('Sounds initialized successfully');
    } catch (error) {
      console.error('Error initializing sounds:', error);
      this.isInitialized = false;
    }
  }

  public async playSound(type: SoundType): Promise<void> {
    if (this.isMuted || !this.isInitialized) return;

    const sound = this.sounds.get(type);
    if (!sound) {
      console.warn(`Sound ${type} not found`);
      return;
    }

    const now = Date.now();
    if (now - sound.lastPlayedTime < this.MIN_PLAY_INTERVAL) {
      return; // Prevent too frequent playback
    }

    try {
      // Find an available audio element from the pool
      const availableAudio = sound.pool.find((audio) => audio.paused);
      if (!availableAudio) {
        // If no available audio element, reuse the oldest one
        const oldestAudio = sound.pool[0];
        oldestAudio.currentTime = 0;
        oldestAudio.volume = sound.volume;
        await oldestAudio.play();
      } else {
        availableAudio.currentTime = 0;
        availableAudio.volume = sound.volume;
        await availableAudio.play();
      }

      sound.lastPlayedTime = now;
    } catch (error) {
      console.error(`Error playing ${type} sound:`, error);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(type: SoundType, volume: number): void {
    const sound = this.sounds.get(type);
    if (sound) {
      const normalizedVolume = Math.max(0, Math.min(1, volume));
      sound.volume = normalizedVolume;
      sound.pool.forEach((audio) => {
        audio.volume = normalizedVolume;
      });
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

export const soundService = SoundService.getInstance();

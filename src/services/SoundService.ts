// src/services/SoundService.ts

type SoundType = 'shoot' | 'explosion' | 'collect';

interface Sound {
  audio: HTMLAudioElement;
  volume: number;
}

export class SoundService {
  private static instance: SoundService;
  private sounds: Map<SoundType, Sound> = new Map();
  private isMuted: boolean = false;

  private readonly SOUND_PATHS = {
    shoot: '/assets/shoot_sound.wav',
    explosion: '/assets/explosion_sound.wav',
    collect: '/assets/collect_sound.wav',
  };

  private constructor() {
    this.preloadSounds();
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private preloadSounds(): void {
    try {
      // Preload each sound
      Object.entries(this.SOUND_PATHS).forEach(([type, path]) => {
        const audio = new Audio(path);
        audio.load(); // Explicitly call load

        this.sounds.set(type as SoundType, {
          audio,
          volume: type === 'explosion' ? 0.6 : 1.0, // Lower volume for explosion
        });
      });

      console.log('Sounds preloaded successfully');
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }

  public async playSound(type: SoundType): Promise<void> {
    if (this.isMuted) return;

    const sound = this.sounds.get(type);
    if (!sound) {
      console.error(`Sound ${type} not found`);
      return;
    }

    try {
      // Clone the audio to allow multiple simultaneous playback
      const audioClone = sound.audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = sound.volume;

      await audioClone.play();

      // Cleanup after playing
      audioClone.addEventListener('ended', () => {
        audioClone.remove();
      });
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
      sound.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

export const soundService = SoundService.getInstance();

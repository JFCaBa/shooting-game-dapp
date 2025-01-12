import { EventEmitter } from 'events';

export type AdNetwork = 'unity' | 'ironsource' | 'applovin' | 'facebook';

interface BaseAdConfig {
  network: AdNetwork;
  appId: string;
  testMode?: boolean;
}

interface UnityAdConfig extends BaseAdConfig {
  network: 'unity';
  placementId: string; // Required for Unity
}

interface IronSourceAdConfig extends BaseAdConfig {
  network: 'ironsource';
  placementId?: string; // Optional for IronSource
}

interface AppLovinAdConfig extends BaseAdConfig {
  network: 'applovin';
  placementId?: string; // Optional for AppLovin
}

interface FacebookAdConfig extends BaseAdConfig {
  network: 'facebook';
  placementId: string; // Required for Facebook
}

type AdConfig =
  | UnityAdConfig
  | IronSourceAdConfig
  | AppLovinAdConfig
  | FacebookAdConfig;

interface AdInstance {
  load: () => Promise<void>;
  show: () => Promise<boolean>;
  isLoaded: () => boolean;
}

/// <reference path="../types/ad-networks.d.ts" />

export class AdService {
  private static instance: AdService;
  private networks: Map<AdNetwork, AdConfig> = new Map();
  private adInstances: Map<AdNetwork, AdInstance> = new Map();
  private currentNetwork: AdNetwork | null = null;
  private events: EventEmitter = new EventEmitter();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  async initialize(configs: AdConfig[]): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Store configurations
      configs.forEach((config) => {
        this.networks.set(config.network, config);
      });

      // Initialize networks in order of preference
      for (const config of configs) {
        try {
          await this.initializeNetwork(config);
          this.currentNetwork = config.network;
          break; // Use the first successfully initialized network
        } catch (error) {
          console.error(`Failed to initialize ${config.network}:`, error);
          continue;
        }
      }

      if (!this.currentNetwork) {
        throw new Error('No ad networks could be initialized');
      }

      this.isInitialized = true;
      this.events.emit('initialized');
    } catch (error) {
      console.error('Ad service initialization failed:', error);
      throw error;
    }
  }

  private async initializeNetwork(config: AdConfig): Promise<void> {
    switch (config.network) {
      case 'unity':
        await this.initializeUnityAds(config);
        break;
      case 'ironsource':
        await this.initializeIronSource(config);
        break;
      case 'applovin':
        await this.initializeAppLovin(config);
        break;
      case 'facebook':
        await this.initializeFacebookAds(config);
        break;
    }
  }

  private async initializeUnityAds(config: AdConfig): Promise<void> {
    if (!config.appId || !config.placementId) {
      throw new Error('Unity Ads requires both appId and placementId');
    }

    // Unity Ads initialization logic
    const script = document.createElement('script');
    script.src = 'https://cdn.unityads.unity3d.com/js/latest/UnityAds.js';
    script.async = true;

    const loadPromise = new Promise<void>((resolve, reject) => {
      script.onload = () => {
        if (typeof UnityAds !== 'undefined') {
          const placementId = config.placementId as string; // Safe assertion since we checked above
          UnityAds.initialize(config.appId, config.testMode || false);

          const adInstance: AdInstance = {
            load: async () => {
              return new Promise((resolve) => {
                UnityAds.load(placementId);
                resolve();
              });
            },
            show: async () => {
              return new Promise((resolve) => {
                UnityAds.show(placementId, {
                  onComplete: () => resolve(true),
                  onSkip: () => resolve(false),
                  onError: () => resolve(false),
                });
              });
            },
            isLoaded: () => UnityAds.isReady(placementId),
          };

          this.adInstances.set('unity', adInstance);
          resolve();
        } else {
          reject(new Error('Unity Ads failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Unity Ads SDK'));
    });

    document.head.appendChild(script);
    await loadPromise;
  }

  private async initializeIronSource(config: AdConfig): Promise<void> {
    // IronSource initialization logic
    const script = document.createElement('script');
    script.src = 'https://cdn.ironspace.com/js/latest/ironSource.js';
    script.async = true;

    const loadPromise = new Promise<void>((resolve, reject) => {
      script.onload = () => {
        if (typeof ironSource !== 'undefined') {
          ironSource.init(config.appId, config.testMode || false);

          const adInstance: AdInstance = {
            load: async () => {
              return new Promise((resolve) => {
                ironSource.loadRewardedVideo();
                resolve();
              });
            },
            show: async () => {
              return new Promise((resolve) => {
                ironSource.showRewardedVideo({
                  onRewarded: () => resolve(true),
                  onClosed: () => resolve(false),
                });
              });
            },
            isLoaded: () => ironSource.isRewardedVideoAvailable(),
          };

          this.adInstances.set('ironsource', adInstance);
          resolve();
        } else {
          reject(new Error('IronSource failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load IronSource SDK'));
    });

    document.head.appendChild(script);
    await loadPromise;
  }

  private async initializeAppLovin(config: AdConfig): Promise<void> {
    // AppLovin initialization logic
    // Similar implementation to Unity and IronSource
  }

  private async initializeFacebookAds(config: AdConfig): Promise<void> {
    // Facebook Audience Network initialization logic
    // Similar implementation to Unity and IronSource
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.currentNetwork || !this.adInstances.get(this.currentNetwork)) {
      throw new Error('No ad network available');
    }

    const adInstance = this.adInstances.get(this.currentNetwork)!;

    try {
      if (!adInstance.isLoaded()) {
        await adInstance.load();
      }
      return await adInstance.show();
    } catch (error) {
      console.error('Error showing ad:', error);
      // Try fallback networks if primary fails
      for (const [network, instance] of this.adInstances) {
        if (network !== this.currentNetwork) {
          try {
            if (!instance.isLoaded()) {
              await instance.load();
            }
            return await instance.show();
          } catch {
            continue;
          }
        }
      }
      return false;
    }
  }

  isSupported(): boolean {
    return this.isInitialized && this.currentNetwork !== null;
  }

  getCurrentNetwork(): AdNetwork | null {
    return this.currentNetwork;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.events.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.events.off(event, callback);
  }
}

export const adService = AdService.getInstance();

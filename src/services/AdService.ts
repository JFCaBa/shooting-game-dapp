import { EventEmitter } from 'events';

export type AdNetwork =
  | 'unity'
  | 'ironsource'
  | 'applovin'
  | 'facebook'
  | 'adsense'
  | 'hardcoded';
interface BaseAdConfig {
  network: AdNetwork;
  appId: string;
  testMode?: boolean;
}

interface UnityAdConfig extends BaseAdConfig {
  network: 'unity';
  placementId: string;
}

interface IronSourceAdConfig extends BaseAdConfig {
  network: 'ironsource';
  placementId?: string;
}

interface AppLovinAdConfig extends BaseAdConfig {
  network: 'applovin';
  placementId?: string;
}

interface FacebookAdConfig extends BaseAdConfig {
  network: 'facebook';
  placementId: string;
}

interface AdSenseConfig extends BaseAdConfig {
  network: 'adsense';
  clientId: string;
  rewardSlot: string;
}

interface HardcodedAdConfig extends BaseAdConfig {
  network: 'hardcoded';
}

type AdType = 'devaneo' | 'bridesandlovers';

interface HardcodedAd {
  type: AdType;
  imageUrl: string;
  targetUrl: string;
  watchTime: number;
}

type AdConfig =
  | UnityAdConfig
  | IronSourceAdConfig
  | AppLovinAdConfig
  | FacebookAdConfig
  | AdSenseConfig
  | HardcodedAdConfig;

interface AdInstance {
  load: () => Promise<void>;
  show: () => Promise<boolean>;
  isLoaded: () => boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
    google: any;
    UnityAds?: any;
    ironSource?: any;
    // Add other ad network globals as needed
  }
}

export class AdService {
  private static instance: AdService;
  private networks: Map<AdNetwork, AdConfig> = new Map();
  private adInstances: Map<AdNetwork, AdInstance> = new Map();
  private currentNetwork: AdNetwork | null = null;
  private events: EventEmitter = new EventEmitter();
  private isInitialized = false;
  private cookiesEnabled = true;
  private adContainer: HTMLDivElement | null = null;

  // Define hardcoded ads
  private readonly hardcodedAds: HardcodedAd[] = [
    {
      type: 'devaneo',
      imageUrl: '/image/ads/devaneo_ad.jpg',
      targetUrl: 'https://devaneo.es',
      watchTime: 10,
    },
    {
      type: 'bridesandlovers',
      imageUrl: '/image/ads/bridesandlovers_ad.jpg',
      targetUrl: 'https://bridesandlovers.com',
      watchTime: 10,
    },
  ];

  private constructor() {
    this.checkCookieStatus();
    this.initializeHardcodedAds();
  }

  private initializeHardcodedAds() {
    const hardcodedInstance: AdInstance = {
      load: async () => Promise.resolve(),
      isLoaded: () => true,
      show: async () => {
        return new Promise<boolean>((resolve) => {
          const ad = this.getRandomHardcodedAd();
          this.showHardcodedAd(ad, resolve);
        });
      },
    };

    this.adInstances.set('hardcoded', hardcodedInstance);
    this.networks.set('hardcoded', {
      network: 'hardcoded',
      appId: 'hardcoded',
    });
    this.currentNetwork = 'hardcoded';
    this.isInitialized = true;
  }

  private getRandomHardcodedAd(): HardcodedAd {
    const randomIndex = Math.floor(Math.random() * this.hardcodedAds.length);
    return this.hardcodedAds[randomIndex];
  }

  private createAdContainer() {
    if (!this.adContainer) {
      this.adContainer = document.createElement('div');
      this.adContainer.style.position = 'fixed';
      this.adContainer.style.inset = '0';
      this.adContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
      this.adContainer.style.display = 'flex';
      this.adContainer.style.alignItems = 'center';
      this.adContainer.style.justifyContent = 'center';
      this.adContainer.style.zIndex = '9999';
      document.body.appendChild(this.adContainer);
    }
  }

  private showHardcodedAd(
    ad: HardcodedAd,
    onComplete: (success: boolean) => void
  ) {
    this.createAdContainer();

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg p-6 max-w-lg w-full mx-4 relative';
    modal.style.cssText = `
      background: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      max-width: 32rem;
      width: 100%;
      margin: 0 1rem;
      position: relative;
    `;

    const countdown = document.createElement('div');
    countdown.style.cssText = `
      position: absolute;
      top: 0.5rem;
      right: 1rem;
      font-size: 1.5rem;
      font-weight: bold;
      color: #4B5563;
    `;

    const image = document.createElement('img');
    image.src = ad.imageUrl;
    image.style.cssText = `
      width: 100%;
      height: auto;
      cursor: pointer;
      transition: transform 0.2s;
    `;
    image.onmouseover = () => (image.style.transform = 'scale(1.05)');
    image.onmouseout = () => (image.style.transform = 'scale(1)');
    image.onclick = () => window.open(ad.targetUrl, '_blank');

    const skipButton = document.createElement('button');
    skipButton.textContent = 'Skip Ad';
    skipButton.style.cssText = `
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      background-color: #E5E7EB;
      border-radius: 0.5rem;
      font-weight: 500;
      color: #1F2937;
      transition: background-color 0.2s;
    `;
    skipButton.onmouseover = () =>
      (skipButton.style.backgroundColor = '#D1D5DB');
    skipButton.onmouseout = () =>
      (skipButton.style.backgroundColor = '#E5E7EB');
    skipButton.onclick = () => {
      if (this.adContainer) {
        document.body.removeChild(this.adContainer);
        this.adContainer = null;
      }
      onComplete(false);
    };

    modal.appendChild(countdown);
    modal.appendChild(image);
    modal.appendChild(skipButton);

    if (this.adContainer) {
      this.adContainer.innerHTML = '';
      this.adContainer.appendChild(modal);
    }

    let timeLeft = ad.watchTime;
    const timer = setInterval(() => {
      timeLeft--;
      countdown.textContent = `${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(timer);
        if (this.adContainer) {
          document.body.removeChild(this.adContainer);
          this.adContainer = null;
        }
        onComplete(true);
      }
    }, 1000);
  }

  static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.currentNetwork || !this.adInstances.get(this.currentNetwork)) {
      if (this.adInstances.get('hardcoded')) {
        const hardcodedInstance = this.adInstances.get('hardcoded')!;
        return await hardcodedInstance.show();
      }
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
      // Try hardcoded ads as fallback
      if (this.adInstances.get('hardcoded')) {
        const hardcodedInstance = this.adInstances.get('hardcoded')!;
        return await hardcodedInstance.show();
      }
      return false;
    }
  }

  private async checkCookieStatus(): Promise<void> {
    try {
      if ('cookieStore' in window) {
        this.cookiesEnabled = true;
      } else {
        const testCookie = 'testCookie=1';
        document.cookie = testCookie;
        this.cookiesEnabled = document.cookie.indexOf(testCookie) !== -1;
      }

      if (!this.cookiesEnabled) {
        await this.setupCookielessAlternatives();
      }
    } catch (error) {
      console.error('Error checking cookie status:', error);
      this.cookiesEnabled = false;
    }
  }

  private async setupCookielessAlternatives(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        console.log('Using localStorage as cookie alternative');
      }

      if ('joinAdInterestGroup' in navigator) {
        console.log('Privacy Sandbox APIs available');
      }

      if ('runAdAuction' in navigator) {
        console.log('FLEDGE API available');
      }

      document.cookie = 'essentialGameData=1; SameSite=Strict; Secure';
    } catch (error) {
      console.error('Error setting up cookieless alternatives:', error);
    }
  }

  async initialize(configs: AdConfig[]): Promise<void> {
    if (this.isInitialized) return;

    try {
      configs.forEach((config) => {
        this.networks.set(config.network, config);
      });

      for (const config of configs) {
        try {
          await this.initializeNetwork(config);
          this.currentNetwork = config.network;
          break;
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
      case 'adsense':
        await this.initializeAdSense(config as AdSenseConfig);
        break;
    }
  }

  // private createAdContainer() {
  //   if (!this.adContainer) {
  //     this.adContainer = document.createElement('div');
  //     this.adContainer.id = 'reward-ad-container';
  //     this.adContainer.style.display = 'none';
  //     this.adContainer.style.position = 'fixed';
  //     this.adContainer.style.top = '50%';
  //     this.adContainer.style.left = '50%';
  //     this.adContainer.style.transform = 'translate(-50%, -50%)';
  //     this.adContainer.style.zIndex = '9999';
  //     this.adContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  //     this.adContainer.style.padding = '20px';
  //     this.adContainer.style.borderRadius = '8px';
  //     document.body.appendChild(this.adContainer);
  //   }
  // }

  private async initializeAdSense(config: AdSenseConfig): Promise<void> {
    this.createAdContainer();

    if (
      !document.querySelector('script[src*="pagead2.googlesyndication.com"]')
    ) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-privacy', 'true');
      script.setAttribute(
        'data-cookie-opt-out',
        !this.cookiesEnabled ? 'true' : 'false'
      );

      const loadPromise = new Promise<void>((resolve, reject) => {
        script.onload = () => {
          window.adsbygoogle = window.adsbygoogle || [];
          (window.adsbygoogle as any).push({
            privacy: {
              personalized: this.cookiesEnabled,
              nonPersonalized: !this.cookiesEnabled,
            },
          });
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load AdSense SDK'));
      });

      document.head.appendChild(script);
      await loadPromise;
    }

    const adInstance: AdInstance = {
      load: async () => {
        // AdSense ads load when shown
        return Promise.resolve();
      },
      show: async () => {
        return new Promise((resolve) => {
          if (!this.adContainer) {
            resolve(false);
            return;
          }

          const adUnit = document.createElement('ins');
          adUnit.className = 'adsbygoogle';
          adUnit.style.display = 'block';
          adUnit.style.width = '300px';
          adUnit.style.height = '250px';
          adUnit.dataset.adClient = config.clientId;
          adUnit.dataset.adSlot = config.rewardSlot;
          adUnit.dataset.adFormat = 'reward';
          adUnit.dataset.nonPersonalized = !this.cookiesEnabled
            ? 'true'
            : 'false';

          this.adContainer.innerHTML = '';
          this.adContainer.style.display = 'block';
          this.adContainer.appendChild(adUnit);

          try {
            (window.adsbygoogle as any).push({
              type: 'reward',
              google_ad_client: config.clientId,
              google_ad_slot: config.rewardSlot,
              reward_callback: () => {
                this.hideAdContainer();
                resolve(true);
              },
              ad_error_callback: () => {
                this.hideAdContainer();
                resolve(false);
              },
            });
          } catch (error) {
            console.error('Error showing AdSense ad:', error);
            this.hideAdContainer();
            resolve(false);
          }
        });
      },
      isLoaded: () => true, // AdSense ads are always considered "loaded"
    };

    this.adInstances.set('adsense', adInstance);
  }

  private hideAdContainer() {
    if (this.adContainer) {
      this.adContainer.style.display = 'none';
      this.adContainer.innerHTML = '';
    }
  }

  private async initializeUnityAds(config: AdConfig): Promise<void> {
    //  Unity implementation...
  }

  private async initializeIronSource(config: AdConfig): Promise<void> {
    //  IronSource implementation...
  }

  private async initializeAppLovin(config: AdConfig): Promise<void> {
    //  AppLovin implementation...
  }

  private async initializeFacebookAds(config: AdConfig): Promise<void> {
    //  Facebook implementation...
  }

  isSupported(): boolean {
    return this.isInitialized && this.currentNetwork !== null;
  }

  getCurrentNetwork(): AdNetwork | null {
    return this.currentNetwork;
  }

  isCookieless(): boolean {
    return !this.cookiesEnabled;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.events.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.events.off(event, callback);
  }

  destroy() {
    if (this.adContainer) {
      document.body.removeChild(this.adContainer);
      this.adContainer = null;
    }
    this.isInitialized = false;
  }
}

export const adService = AdService.getInstance();

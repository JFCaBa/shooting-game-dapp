// src/services/AdManager.ts

declare global {
  interface Window {
    adsbygoogle: any[];
    google: any;
  }
}

interface AdSenseConfig {
  google_ad_client: string | undefined;
  google_ad_slot: string | undefined;
  type: 'reward';
  reward_callback: (reward: any) => void;
  ad_error_callback: (error: any) => void;
}

export class AdManager {
  private static instance: AdManager;
  private adContainer: HTMLDivElement | null = null;
  private isAdLoaded: boolean = false;
  private onRewardCallback: (() => void) | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.initializeAds();
    }
  }

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  private initializeAds() {
    if (this.isInitialized) return;

    // Add the Google AdSense script if it's not already present
    if (
      !document.querySelector('script[src*="pagead2.googlesyndication.com"]')
    ) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.REACT_APP_ADSENSE_CLIENT_ID}`;
      script.async = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        console.log('🎯 AdSense script loaded successfully');
        // Initialize adsbygoogle array only once
        window.adsbygoogle = window.adsbygoogle || [];
      };

      script.onerror = (error) => {
        console.error('❌ Error loading AdSense script:', error);
      };

      document.head.appendChild(script);
    }

    this.createAdContainer();
    this.isInitialized = true;
  }

  private createAdContainer() {
    if (!this.adContainer) {
      this.adContainer = document.createElement('div');
      this.adContainer.id = 'reward-ad-container';
      this.adContainer.style.display = 'none';
      this.adContainer.style.position = 'fixed';
      this.adContainer.style.top = '50%';
      this.adContainer.style.left = '50%';
      this.adContainer.style.transform = 'translate(-50%, -50%)';
      this.adContainer.style.zIndex = '9999';
      this.adContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      this.adContainer.style.padding = '20px';
      this.adContainer.style.borderRadius = '8px';
      document.body.appendChild(this.adContainer);
    }
  }

  async showRewardAd(onReward: () => void): Promise<boolean> {
    console.log('🎮 Attempting to show reward ad');

    if (!this.adContainer || !window.adsbygoogle) {
      console.error('❌ Ad container or AdSense not initialized');
      return false;
    }

    return new Promise((resolve) => {
      this.onRewardCallback = onReward;
      this.adContainer!.style.display = 'block';

      const adUnit = document.createElement('ins');
      adUnit.className = 'adsbygoogle';
      adUnit.style.display = 'block';
      adUnit.style.width = '300px';
      adUnit.style.height = '250px';
      adUnit.dataset.adClient = process.env.REACT_APP_ADSENSE_CLIENT_ID;
      adUnit.dataset.adSlot = process.env.REACT_APP_ADSENSE_REWARD_SLOT;
      adUnit.dataset.adFormat = 'reward';

      this.adContainer!.innerHTML = '';
      this.adContainer!.appendChild(adUnit);

      try {
        const adConfig: AdSenseConfig = {
          google_ad_client: process.env.REACT_APP_ADSENSE_CLIENT_ID,
          google_ad_slot: process.env.REACT_APP_ADSENSE_REWARD_SLOT,
          type: 'reward',
          reward_callback: (reward) => {
            console.log('🎁 Reward granted:', reward);
            this.handleReward();
            resolve(true);
            this.hideAd();
          },
          ad_error_callback: (error) => {
            console.error('❌ Ad error:', error);
            this.hideAd();
            resolve(false);
          },
        };

        // Push only the reward ad configuration
        window.adsbygoogle.push(adConfig);

        this.isAdLoaded = true;
        console.log('✅ Ad request pushed successfully');
      } catch (error) {
        console.error('❌ Error loading reward ad:', error);
        this.hideAd();
        resolve(false);
      }
    });
  }

  private handleReward() {
    if (this.onRewardCallback) {
      this.onRewardCallback();
      this.onRewardCallback = null;
    }
  }

  private hideAd() {
    if (this.adContainer) {
      this.adContainer.style.display = 'none';
      this.adContainer.innerHTML = '';
    }
    this.isAdLoaded = false;
  }

  destroy() {
    if (this.adContainer) {
      document.body.removeChild(this.adContainer);
      this.adContainer = null;
    }
    this.isInitialized = false;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && Array.isArray(window.adsbygoogle);
  }
}

export const adManager = AdManager.getInstance();

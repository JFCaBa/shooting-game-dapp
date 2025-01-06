// src/services/AdManager.ts

export class AdManager {
  private static instance: AdManager;
  private adContainer: HTMLDivElement | null = null;
  private isAdLoaded: boolean = false;
  private onRewardCallback: (() => void) | null = null;

  private constructor() {
    this.initializeAds();
  }

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  private initializeAds() {
    if (
      !document.querySelector('script[src*="pagead2.googlesyndication.com"]')
    ) {
      const script = document.createElement('script');
      script.src =
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.adClient = process.env.REACT_APP_ADSENSE_CLIENT_ID || '';
      document.head.appendChild(script);
    }

    // Initialize adsbygoogle array if it doesn't exist
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }

    this.createAdContainer();
  }

  private createAdContainer() {
    this.adContainer = document.createElement('div');
    this.adContainer.style.display = 'none';
    this.adContainer.style.position = 'fixed';
    this.adContainer.style.top = '50%';
    this.adContainer.style.left = '50%';
    this.adContainer.style.transform = 'translate(-50%, -50%)';
    this.adContainer.style.zIndex = '9999';
    document.body.appendChild(this.adContainer);
  }

  showRewardAd(onReward: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.adContainer || !window.adsbygoogle) {
        console.error('Ad container or AdSense not initialized');
        resolve(false);
        return;
      }

      this.onRewardCallback = onReward;
      this.adContainer.style.display = 'block';

      const adUnit = document.createElement('ins');
      adUnit.className = 'adsbygoogle';
      adUnit.style.display = 'block';
      adUnit.style.width = '300px';
      adUnit.style.height = '250px';
      adUnit.dataset.adFormat = 'reward';
      adUnit.dataset.adClient = process.env.REACT_APP_ADSENSE_CLIENT_ID || '';
      adUnit.dataset.adSlot = process.env.REACT_APP_ADSENSE_REWARD_SLOT || '';

      this.adContainer.appendChild(adUnit);

      try {
        const adConfig: AdSenseConfig = {
          google_ad_client: process.env.REACT_APP_ADSENSE_CLIENT_ID,
          google_ad_slot: process.env.REACT_APP_ADSENSE_REWARD_SLOT,
          type: 'reward',
          params: {
            tagForChildDirectedTreatment: 1,
          },
          reward_callback: (reward) => {
            if (reward) {
              this.handleReward();
              resolve(true);
            } else {
              console.log('No reward granted');
              resolve(false);
            }
            this.hideAd();
          },
          ad_error_callback: (error) => {
            console.error('Ad error:', error);
            this.hideAd();
            resolve(false);
          },
        };

        // Add the ad configuration to the adsbygoogle array
        if (Array.isArray(window.adsbygoogle)) {
          window.adsbygoogle.push(adConfig);
          this.isAdLoaded = true;
        }
      } catch (error) {
        console.error('Error loading reward ad:', error);
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
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && Array.isArray(window.adsbygoogle);
  }
}

export const adManager = AdManager.getInstance();

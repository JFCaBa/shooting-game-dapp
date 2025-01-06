// src/types/ad.d.ts

export {};

declare global {
  interface RewardedAd {
    type: string;
    amount: string;
  }

  interface AdBreak {
    reward?: RewardedAd;
    breakStatus: 'success' | 'error' | 'timeout';
    breakType: 'reward';
  }

  interface AdSenseConfig {
    type?: 'reward';
    params?: {
      tagForChildDirectedTreatment?: number;
    };
    reward_callback?: (reward: RewardedAd | undefined) => void;
    ad_error_callback?: (error: Error) => void;
    google_ad_client?: string;
    enable_page_level_ads?: boolean;
    overlays?: { bottom: boolean };
    google_ad_slot?: string;
    google_ad_format?: string;
  }

  // The key change is here in the Window interface
  interface Window {
    adsbygoogle: AdSenseConfig[];
  }
}

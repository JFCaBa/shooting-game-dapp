// Unity Ads Type Definitions
declare namespace UnityAds {
  interface ShowOptions {
    onComplete: () => void;
    onSkip: () => void;
    onError: (error: any) => void;
  }

  function initialize(gameId: string, testMode: boolean): void;
  function load(placementId: string): void;
  function show(placementId: string, options: ShowOptions): void;
  function isReady(placementId: string): boolean;
}

declare const UnityAds: typeof UnityAds;

// IronSource Type Definitions
interface IronSourceEvents {
  onRewarded: () => void;
  onClosed: () => void;
}

declare namespace ironSource {
  function init(appKey: string, testMode: boolean): void;
  function loadRewardedVideo(): void;
  function showRewardedVideo(callbacks: IronSourceEvents): void;
  function isRewardedVideoAvailable(): boolean;
}

declare const ironSource: typeof ironSource;

// AppLovin Type Definitions
interface AppLovinCallbacks {
  onAdLoaded: () => void;
  onAdDisplayed: () => void;
  onAdHidden: () => void;
  onAdClicked: () => void;
  onAdLoadFailed: (errorCode: string) => void;
  onAdDisplayFailed: (errorCode: string) => void;
  onUserRewarded: (reward: { amount: number; type: string }) => void;
}

declare namespace AppLovin {
  function initialize(
    sdkKey: string,
    callbacks: Partial<AppLovinCallbacks>
  ): void;
  function loadRewardedAd(): void;
  function showRewardedAd(): void;
  function isRewardedAdReady(): boolean;
}

declare const AppLovin: typeof AppLovin;

// Facebook Audience Network Type Definitions
declare namespace FAN {
  interface RewardedVideoAdInstance {
    loadAd(): void;
    showAd(): void;
    isAdLoaded(): boolean;
  }

  interface RewardData {
    amount: number;
    type: string;
  }

  interface AdCallbacks {
    onError?: (error: any) => void;
    onAdLoaded?: () => void;
    onAdClicked?: () => void;
    onLoggingImpression?: () => void;
    onMediaCompleted?: () => void;
    onRewardedComplete?: (reward: RewardData) => void;
  }

  function init(applicationId: string): void;
  function loadRewardedVideo(
    placementId: string,
    callbacks: AdCallbacks
  ): RewardedVideoAdInstance;
}

declare const FAN: typeof FAN;

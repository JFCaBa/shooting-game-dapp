// src/services/HardcodedAdService.ts

export type AdType = 'devaneo' | 'bridesandlovers';

interface HardcodedAd {
  type: AdType;
  imageUrl: string;
  targetUrl: string;
  watchTime: number; // in seconds
}

type AdCallback = () => void;

export class HardcodedAdService {
  private static instance: HardcodedAdService;
  private readonly ads: HardcodedAd[] = [
    {
      type: 'devaneo',
      imageUrl: '/image/ads/devaneo_ad.jpg',
      targetUrl: 'https://devaneo.es',
      watchTime: 30,
    },
    {
      type: 'bridesandlovers',
      imageUrl: '/image/ads/bridesandlovers_ad.jpg',
      targetUrl: 'https://bridesandlovers.com',
      watchTime: 30,
    },
  ];

  private constructor() {}

  public static getInstance(): HardcodedAdService {
    if (!HardcodedAdService.instance) {
      HardcodedAdService.instance = new HardcodedAdService();
    }
    return HardcodedAdService.instance;
  }

  private getRandomAd(): HardcodedAd {
    const randomIndex = Math.floor(Math.random() * this.ads.length);
    return this.ads[randomIndex];
  }

  public showAd(onComplete?: AdCallback, onSkip?: AdCallback): void {
    const ad = this.getRandomAd();

    // Create and show modal
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';

    const content = document.createElement('div');
    content.className = 'bg-white rounded-lg p-6 max-w-lg w-full mx-4 relative';

    const countdown = document.createElement('div');
    countdown.className = 'absolute top-2 right-4 text-gray-600';

    const image = document.createElement('img');
    image.src = ad.imageUrl;
    image.className = 'w-full h-auto cursor-pointer';
    image.onclick = () => {
      window.open(ad.targetUrl, '_blank');
    };

    const skipButton = document.createElement('button');
    skipButton.textContent = 'Skip';
    skipButton.className =
      'mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300';
    skipButton.onclick = () => {
      document.body.removeChild(modal);
      if (onSkip) onSkip();
    };

    content.appendChild(countdown);
    content.appendChild(image);
    content.appendChild(skipButton);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Start countdown
    let timeLeft = ad.watchTime;
    const timer = setInterval(() => {
      timeLeft--;
      countdown.textContent = `${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(timer);
        document.body.removeChild(modal);
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  public getAds(): HardcodedAd[] {
    return [...this.ads];
  }
}

export const hardcodedAdService = HardcodedAdService.getInstance();

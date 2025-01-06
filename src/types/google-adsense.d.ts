// src/types/google-adsense.d.ts

interface InsElement extends HTMLElement {
  className: 'adsbygoogle';
  dataset: {
    adClient: string;
    adSlot: string;
    adFormat: string;
  };
}

declare namespace google {
  namespace adsense {
    function push(element: InsElement): void;
  }
}

// src/services/PersonDetector.ts
import * as cocossd from '@tensorflow-models/coco-ssd';

export class PersonDetector {
  private detector: cocossd.ObjectDetection | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor() {
    this.initializeDetector();
    this.findCameraElement();
  }

  private async initializeDetector() {
    try {
      this.detector = await cocossd.load();
    } catch (error) {
      console.error('Failed to load person detection model:', error);
    }
  }

  private findCameraElement() {
    // Find the camera video element
    this.videoElement = document.querySelector('video');
    if (!this.videoElement) {
      console.warn('No video element found for person detection');
    }
  }

  private getCameraFeed(): ImageData | null {
    if (!this.videoElement) {
      this.findCameraElement(); // Try to find it again in case it was added later
      if (!this.videoElement) return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      ctx.drawImage(this.videoElement, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Failed to get camera feed:', error);
      return null;
    }
  }

  public async detectPerson(): Promise<boolean> {
    if (!this.detector) {
      console.warn('Person detector not initialized');
      return false;
    }

    const imageData = this.getCameraFeed();
    if (!imageData) {
      console.warn('No camera feed available');
      return false;
    }

    try {
      const predictions = await this.detector.detect(imageData);
      const personFound = predictions.some(
        (pred) => pred.class === 'person' && pred.score > 0.7
      );

      console.log(
        `Person detection result: ${personFound ? 'Found' : 'Not found'}`
      );
      return personFound;
    } catch (error) {
      console.error('Person detection failed:', error);
      return false;
    }
  }
}

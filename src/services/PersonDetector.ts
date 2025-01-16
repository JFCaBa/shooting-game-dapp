// src/services/PersonDetector.ts
import * as cocossd from '@tensorflow-models/coco-ssd';

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export class PersonDetector {
  private detector: cocossd.ObjectDetection | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private debugOverlay: HTMLDivElement | null = null;
  private isDebugging: boolean = true; // Toggle for debug visualization

  constructor() {
    this.initializeDetector();
    this.findCameraElement();
    if (this.isDebugging) {
      this.createDebugOverlay();
    }
  }

  private createDebugOverlay() {
    this.debugOverlay = document.createElement('div');
    this.debugOverlay.style.position = 'absolute';
    this.debugOverlay.style.top = '0';
    this.debugOverlay.style.left = '0';
    this.debugOverlay.style.width = '100%';
    this.debugOverlay.style.height = '100%';
    this.debugOverlay.style.pointerEvents = 'none';
    document.body.appendChild(this.debugOverlay);
  }

  private updateDebugVisualization(detections: DetectionBox[]) {
    if (!this.debugOverlay || !this.videoElement) return;

    // Clear previous boxes
    this.debugOverlay.innerHTML = '';

    // Calculate scale factors
    const scaleX = window.innerWidth / this.videoElement.videoWidth;
    const scaleY = window.innerHeight / this.videoElement.videoHeight;

    detections.forEach((detection) => {
      const box = document.createElement('div');
      box.style.position = 'absolute';
      box.style.border = '2px solid #00ff00';
      box.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';

      // Scale the detection coordinates to match screen size
      box.style.left = `${detection.x * scaleX}px`;
      box.style.top = `${detection.y * scaleY}px`;
      box.style.width = `${detection.width * scaleX}px`;
      box.style.height = `${detection.height * scaleY}px`;

      // Add confidence label
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = '-25px';
      label.style.left = '0';
      label.style.backgroundColor = 'rgba(0, 255, 0, 0.8)';
      label.style.color = 'white';
      label.style.padding = '2px 6px';
      label.style.borderRadius = '3px';
      label.textContent = `Person: ${Math.round(detection.confidence * 100)}%`;

      box.appendChild(label);
      this.debugOverlay.appendChild(box);
    });
  }

  private async initializeDetector() {
    try {
      this.detector = await cocossd.load();
      console.log('Person detector initialized successfully');
    } catch (error) {
      console.error('Failed to load person detection model:', error);
    }
  }

  private findCameraElement() {
    this.videoElement = document.querySelector('video');
    if (!this.videoElement) {
      console.warn('No video element found for person detection');
    }
  }

  private getCameraFeed(): ImageData | null {
    if (!this.videoElement) {
      this.findCameraElement();
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
      const personDetections = predictions
        .filter((pred) => pred.class === 'person' && pred.score > 0.7)
        .map((pred) => ({
          x: pred.bbox[0],
          y: pred.bbox[1],
          width: pred.bbox[2],
          height: pred.bbox[3],
          confidence: pred.score,
        }));

      if (this.isDebugging) {
        this.updateDebugVisualization(personDetections);
      }

      const personFound = personDetections.length > 0;
      console.log(
        `Person detection result: ${personFound ? 'Found' : 'Not found'}`,
        personDetections
      );

      return personFound;
    } catch (error) {
      console.error('Person detection failed:', error);
      return false;
    }
  }

  public cleanup() {
    if (this.debugOverlay) {
      this.debugOverlay.remove();
      this.debugOverlay = null;
    }
  }

  public toggleDebug(enabled: boolean) {
    this.isDebugging = enabled;
    if (!enabled && this.debugOverlay) {
      this.debugOverlay.innerHTML = '';
    } else if (enabled && !this.debugOverlay) {
      this.createDebugOverlay();
    }
  }
}

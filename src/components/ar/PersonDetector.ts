import * as tf from '@tensorflow/tfjs';
import * as posedetection from '@tensorflow-models/pose-detection';

export class PersonDetector {
  private detector: posedetection.PoseDetector | null = null;
  private videoElement: HTMLVideoElement;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
  }

  public async initialize(): Promise<void> {
    if (!this.detector) {
      this.detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        { modelType: 'lite' } // Use a lightweight model
      );
    }

    // Start video feed
    await this.startVideoFeed();
  }

  private async startVideoFeed(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    this.videoElement.srcObject = stream;
    await this.videoElement.play();
  }

  public async detect(): Promise<posedetection.Pose[] | null> {
    if (
      !this.detector ||
      this.videoElement.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
    ) {
      return null;
    }

    return this.detector.estimatePoses(this.videoElement);
  }

  public cleanup(): void {
    if (this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    this.videoElement.srcObject = null;
  }
}

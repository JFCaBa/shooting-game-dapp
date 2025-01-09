import React, { useEffect, useRef } from 'react';

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let currentVideo = videoRef.current;
    let mediaStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        console.log('Requesting camera access...');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: window.innerWidth },
            height: { ideal: window.innerHeight },
          },
          audio: false,
        });

        console.log(
          'Camera access granted',
          mediaStream.getVideoTracks()[0].getSettings()
        );

        if (currentVideo) {
          currentVideo.srcObject = mediaStream;
          // Log when video starts playing
          currentVideo.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            currentVideo
              ?.play()
              .then(() => console.log('Video playback started'))
              .catch((err) =>
                console.error('Error starting video playback:', err)
              );
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    startCamera();

    return () => {
      console.log('Cleaning up camera...');
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
          console.log('Camera track stopped:', track.label);
        });
      }
      if (currentVideo) {
        currentVideo.srcObject = null;
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
      style={{ backgroundColor: 'transparent' }}
    />
  );
};

export default Camera;

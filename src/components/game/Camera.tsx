import React, { useEffect, useRef } from 'react';

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let currentVideo = videoRef.current;
    let mediaStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: window.innerWidth },
            height: { ideal: window.innerHeight }
          } 
        });
        
        if (currentVideo) {
          currentVideo.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    startCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
};

export default Camera;
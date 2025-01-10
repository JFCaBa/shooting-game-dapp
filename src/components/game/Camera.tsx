import React, { useEffect, useRef } from 'react';

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        // Only request camera if we don't already have a stream
        if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: window.innerWidth },
              height: { ideal: window.innerHeight },
            },
          });

          // Check if component is still mounted before updating
          if (isMounted && videoRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            console.log('Camera stream initialized');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error accessing camera:', err);
        }
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.log('Camera cleanup completed');
    };
  }, []); // Empty dependency array since we only want this to run once

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
};

export default React.memo(Camera); // Use memo to prevent unnecessary re-renders

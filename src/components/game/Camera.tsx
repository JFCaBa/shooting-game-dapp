import React, { useEffect, useRef } from 'react';
import { useCamera } from '../../context/CameraContext';

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, isLoadingCameras, cameraError } = useCamera();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (cameraError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-white text-center p-4">
          <p className="text-red-500 mb-2">Camera Error</p>
          <p>{cameraError}</p>
        </div>
      </div>
    );
  }

  if (isLoadingCameras || !stream) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
          <p>Initializing camera...</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
};

export default React.memo(Camera);

import React, { createContext, useContext, useState, useEffect } from 'react';

interface VideoDevice {
  deviceId: string;
  label: string;
  kind: string;
  facingMode?: string;
}

interface CameraContextType {
  selectedCameraId: string | null;
  setSelectedCameraId: (id: string) => void;
  stream: MediaStream | null;
  availableCameras: VideoDevice[];
  isLoadingCameras: boolean;
  cameraError: string | null;
  refreshCameras: () => Promise<void>;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

let camerasCache: VideoDevice[] | null = null;

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
    localStorage.getItem('selectedCameraId')
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<VideoDevice[]>(
    camerasCache || []
  );
  const [isLoadingCameras, setIsLoadingCameras] = useState(!camerasCache);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCameraStream = async (deviceId: string | null = null) => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = deviceId
        ? {
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: window.innerWidth },
              height: { ideal: window.innerHeight },
            },
          }
        : {
            video: {
              facingMode: 'environment',
              width: { ideal: window.innerWidth },
              height: { ideal: window.innerHeight },
            },
          };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      return newStream;
    } catch (error) {
      console.error('Error starting camera stream:', error);
      // If environment camera fails, try any camera
      if (!deviceId) {
        try {
          const anyStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          setStream(anyStream);
          return anyStream;
        } catch (fallbackError) {
          console.error('Fallback camera error:', fallbackError);
          setCameraError('Failed to initialize any camera');
          throw fallbackError;
        }
      }
      throw error;
    }
  };

  const initializeCameras = async () => {
    try {
      setIsLoadingCameras(true);
      setCameraError(null);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${devices.indexOf(device) + 1}`,
          kind: device.kind,
          facingMode: device.label.toLowerCase().includes('back')
            ? 'environment'
            : 'user',
        }));

      camerasCache = videoDevices;
      setAvailableCameras(videoDevices);

      // If we don't have a selected camera, choose one
      if (!selectedCameraId && videoDevices.length > 0) {
        const backCamera = videoDevices.find(
          (device) => device.facingMode === 'environment'
        );
        const newCameraId = backCamera
          ? backCamera.deviceId
          : videoDevices[0].deviceId;
        setSelectedCameraId(newCameraId);
        localStorage.setItem('selectedCameraId', newCameraId);

        // If we got a stream with the environment camera, keep it
        // Otherwise, start a new stream with the selected camera
        if (!backCamera) {
          await startCameraStream(newCameraId);
        }
      }

      setIsLoadingCameras(false);
    } catch (error) {
      console.error('Error initializing cameras:', error);
      setCameraError('Failed to initialize cameras');
      setIsLoadingCameras(false);
    }
  };

  const refreshCameras = async () => {
    camerasCache = null;
    await initializeCameras();
  };

  // Initialize cameras on mount
  useEffect(() => {
    initializeCameras();

    const handleDeviceChange = () => {
      console.log('Devices changed, refreshing cameras...');
      refreshCameras();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange
      );
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle camera selection changes
  useEffect(() => {
    if (selectedCameraId) {
      startCameraStream(selectedCameraId).catch(console.error);
    }
  }, [selectedCameraId]);

  return (
    <CameraContext.Provider
      value={{
        selectedCameraId,
        setSelectedCameraId,
        stream,
        availableCameras,
        isLoadingCameras,
        cameraError,
        refreshCameras,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};

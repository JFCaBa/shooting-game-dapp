import React, { createContext, useContext, useState, useEffect } from 'react';

interface VideoDevice {
  deviceId: string;
  label: string;
  kind: string;
  facingMode?: string;
}

interface Resolution {
  width: number;
  height: number;
  label: string;
}

interface CameraContextType {
  selectedCameraId: string | null;
  setSelectedCameraId: (id: string) => void;
  stream: MediaStream | null;
  availableCameras: VideoDevice[];
  isLoadingCameras: boolean;
  cameraError: string | null;
  refreshCameras: () => Promise<void>;
  currentResolution: Resolution | null;
  setResolution: (resolution: Resolution) => Promise<void>;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

let camerasCache: VideoDevice[] | null = null;

const DEFAULT_RESOLUTION: Resolution = {
  width: 1280,
  height: 720,
  label: 'HD (1280×720)',
};

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
    localStorage.getItem('selectedCameraId')
  );
  const [currentResolution, setCurrentResolution] = useState<Resolution | null>(
    null
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<VideoDevice[]>(
    camerasCache || []
  );
  const [isLoadingCameras, setIsLoadingCameras] = useState(!camerasCache);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCameraStream = async (
    deviceId: string | null = null,
    resolution: Resolution = DEFAULT_RESOLUTION
  ) => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = deviceId
        ? {
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: resolution.width },
              height: { ideal: resolution.height },
            },
          }
        : {
            video: {
              facingMode: 'environment',
              width: { ideal: resolution.width },
              height: { ideal: resolution.height },
            },
          };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setCurrentResolution(resolution);
      return newStream;
    } catch (error) {
      console.error('Error starting camera stream:', error);
      // If environment camera fails, try any camera
      if (!deviceId) {
        try {
          const anyStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: resolution.width },
              height: { ideal: resolution.height },
            },
          });
          setStream(anyStream);
          setCurrentResolution(resolution);
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

  const setResolution = async (resolution: Resolution) => {
    try {
      await startCameraStream(selectedCameraId, resolution);
    } catch (error) {
      console.error('Error setting resolution:', error);
      setCameraError('Failed to set camera resolution');
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

        // Start stream with default resolution
        await startCameraStream(newCameraId, DEFAULT_RESOLUTION);
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
      startCameraStream(
        selectedCameraId,
        currentResolution || DEFAULT_RESOLUTION
      ).catch(console.error);
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
        currentResolution,
        setResolution,
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

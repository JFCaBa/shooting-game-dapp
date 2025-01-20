import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useCamera } from '../../context/CameraContext';

interface Resolution {
  width: number;
  height: number;
  label: string;
}

const RESOLUTIONS: Resolution[] = [
  { width: 3840, height: 2160, label: '4K (3840×2160)' },
  { width: 1920, height: 1080, label: 'FHD (1920×1080)' },
  { width: 1280, height: 720, label: 'HD (1280×720)' },
  { width: 854, height: 480, label: 'SD (854×480)' },
  { width: 640, height: 360, label: 'LD (640×360)' },
];

const CameraResolutionSettings: React.FC = () => {
  const { selectedCameraId, setResolution, currentResolution } = useCamera();
  const [supportedResolutions, setSupportedResolutions] = useState<
    Resolution[]
  >([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkSupportedResolutions();
  }, [selectedCameraId]);

  const checkSupportedResolutions = async () => {
    if (!selectedCameraId) return;

    setIsChecking(true);
    const supported: Resolution[] = [];

    for (const resolution of RESOLUTIONS) {
      try {
        const constraints = {
          video: {
            deviceId: { exact: selectedCameraId },
            width: { exact: resolution.width },
            height: { exact: resolution.height },
          },
        };

        const testStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        supported.push(resolution);
        testStream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.log(`Resolution ${resolution.label} not supported`);
      }
    }

    setSupportedResolutions(supported);
    setIsChecking(false);
  };

  const handleResolutionChange = (resolution: Resolution) => {
    setResolution(resolution);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-medium text-white">Resolution Settings</h3>
      </div>

      {isChecking ? (
        <div className="text-gray-400 flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking supported resolutions...</span>
        </div>
      ) : supportedResolutions.length === 0 ? (
        <div className="text-gray-400">No supported resolutions found</div>
      ) : (
        <div className="space-y-2">
          {supportedResolutions.map((resolution) => (
            <button
              key={`${resolution.width}x${resolution.height}`}
              onClick={() => handleResolutionChange(resolution)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                currentResolution?.width === resolution.width &&
                currentResolution?.height === resolution.height
                  ? 'bg-game-primary text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{resolution.label}</div>
              <div className="text-sm opacity-75">
                {resolution.width} × {resolution.height}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CameraResolutionSettings;

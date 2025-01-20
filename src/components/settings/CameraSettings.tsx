import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { useCamera } from '../../context/CameraContext';
import CameraResolutionSettings from './CameraResolutionSettings';

const CameraSettings: React.FC = () => {
  const {
    selectedCameraId,
    setSelectedCameraId,
    availableCameras,
    isLoadingCameras,
    cameraError,
    refreshCameras,
  } = useCamera();

  return (
    <div className="space-y-6">
      {/* Camera Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-white">Camera Selection</h3>
          </div>
          <button
            onClick={() => refreshCameras()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            disabled={isLoadingCameras}
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoadingCameras ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {isLoadingCameras ? (
          <div className="text-gray-400">Loading cameras...</div>
        ) : cameraError ? (
          <div className="text-red-500">{cameraError}</div>
        ) : availableCameras.length === 0 ? (
          <div className="text-gray-400">No cameras found</div>
        ) : (
          <div className="space-y-2">
            {availableCameras.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => setSelectedCameraId(device.deviceId)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedCameraId === device.deviceId
                    ? 'bg-game-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">{device.label}</div>
                <div className="text-sm opacity-75">
                  {device.facingMode === 'environment'
                    ? 'Back Camera'
                    : 'Front Camera'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Settings */}
      <div className="border-t border-gray-700 pt-6">
        <CameraResolutionSettings />
      </div>
    </div>
  );
};

export default CameraSettings;

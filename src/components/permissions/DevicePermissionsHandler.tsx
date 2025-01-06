import React, { useEffect, useState } from 'react';

interface DevicePermissionsHandlerProps {
  children: React.ReactNode;
}

const DevicePermissionsHandler: React.FC<DevicePermissionsHandlerProps> = ({
  children,
}) => {
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request device orientation permissions
        if (
          typeof DeviceOrientationEvent !== 'undefined' &&
          typeof (DeviceOrientationEvent as any).requestPermission ===
            'function'
        ) {
          try {
            const permissionState = await (
              DeviceOrientationEvent as any
            ).requestPermission();
            console.log('Device orientation permission:', permissionState);
          } catch (err) {
            console.error(
              'Error requesting device orientation permission:',
              err
            );
          }
        }

        // Request motion permissions
        if (
          typeof DeviceMotionEvent !== 'undefined' &&
          typeof (DeviceMotionEvent as any).requestPermission === 'function'
        ) {
          try {
            const motionPermissionState = await (
              DeviceMotionEvent as any
            ).requestPermission();
            console.log('Device motion permission:', motionPermissionState);
          } catch (err) {
            console.error('Error requesting motion permission:', err);
          }
        }

        // Request camera permissions
        try {
          await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
        } catch (err) {
          console.error('Error requesting camera permission:', err);
        }

        // Request location permissions
        try {
          await navigator.geolocation.getCurrentPosition(() => {});
        } catch (err) {
          console.error('Error requesting location permission:', err);
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      } finally {
        setPermissionsChecked(true);
      }
    };

    // Add click handler to request permissions
    const handleInitialUserInteraction = () => {
      requestPermissions();
      document.removeEventListener('click', handleInitialUserInteraction);
    };

    // iOS requires user interaction before requesting permissions
    document.addEventListener('click', handleInitialUserInteraction);

    return () => {
      document.removeEventListener('click', handleInitialUserInteraction);
    };
  }, []);

  return permissionsChecked ? (
    <>{children}</>
  ) : (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm mx-4 text-center">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Welcome to AR Shooting Game!
        </h2>
        <p className="text-gray-600 mb-4">
          Please tap anywhere on the screen to grant required permissions for
          the best experience.
        </p>
        <div className="space-y-2 text-left text-sm text-gray-500 mb-4">
          <p>• Camera access for AR view</p>
          <p>• Location for player positioning</p>
          <p>• Motion sensors for AR controls</p>
        </div>
      </div>
    </div>
  );
};

export default DevicePermissionsHandler;

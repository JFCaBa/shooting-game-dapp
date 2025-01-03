import React, { useEffect, useRef, useState } from 'react';
import { DroneData, Position3D } from '../../types/drone';
import { useLocationContext } from '../../context/LocationContext';
import { LocationData } from '../../types/game';

interface ARDroneProps {
  drone: DroneData;
  onShoot?: (droneId: string) => void;
}

const ARDrone: React.FC<ARDroneProps> = ({ drone, onShoot }) => {
  const modelRef = useRef<HTMLDivElement>(null);
  const { location: playerLocation } = useLocationContext();
  const [isVisible, setIsVisible] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (!playerLocation) return;

    // Calculate relative position
    const relativePosition = calculateRelativePosition(drone.position, playerLocation);
    
    if (modelRef.current) {
      updateDronePosition(modelRef.current, relativePosition);
    }

    // Check if drone is in view
    const inView = isInFieldOfView(relativePosition);
    setIsVisible(inView);

    // Update rotation
    const newRotation = calculateRotation(relativePosition);
    setRotation(newRotation);
  }, [drone.position, playerLocation]);

  const calculateRelativePosition = (dronePos: Position3D, playerLoc: LocationData) => {
    // Convert coordinates and calculate relative position
    // This is a simplified example - you'll need to adjust based on your coordinate system
    return {
      x: dronePos.x - (playerLoc.longitude * 111111),
      y: dronePos.y - (playerLoc.latitude * 111111),
      z: dronePos.z - (playerLoc.altitude || 0)
    };
  };

  const updateDronePosition = (element: HTMLDivElement, position: Position3D) => {
    // Convert 3D position to screen coordinates
    const screenX = position.x * (window.innerWidth / 2);
    const screenY = position.y * (window.innerHeight / 2);
    const scale = Math.max(0.2, 1 - (Math.abs(position.z) / 1000));

    element.style.transform = `
      translate(${screenX}px, ${screenY}px)
      scale(${scale})
      rotateX(${rotation.x}deg)
      rotateY(${rotation.y}deg)
      rotateZ(${rotation.z}deg)
    `;
  };

  const isInFieldOfView = (position: Position3D) => {
    // Implement field of view check
    // This is a simplified version - adjust based on your requirements
    const horizontalFOV = 60; // degrees
    const verticalFOV = 45; // degrees
    
    const angleHorizontal = Math.atan2(position.x, position.z) * (180 / Math.PI);
    const angleVertical = Math.atan2(position.y, position.z) * (180 / Math.PI);
    
    return Math.abs(angleHorizontal) < horizontalFOV / 2 &&
           Math.abs(angleVertical) < verticalFOV / 2;
  };

  const calculateRotation = (position: Position3D) => {
    return {
      x: Math.atan2(position.y, position.z) * (180 / Math.PI),
      y: Math.atan2(position.x, position.z) * (180 / Math.PI),
      z: 0
    };
  };

  if (!isVisible) return null;

  return (
    <div
      ref={modelRef}
      className="absolute top-1/2 left-1/2 w-16 h-16 transform -translate-x-1/2 -translate-y-1/2"
      onClick={() => onShoot?.(drone.droneId)}
    >
      {/* Placeholder drone model - replace with your 3D model */}
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-red-500 opacity-50 rounded-full animate-pulse" />
        {drone.reward && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 
                         bg-yellow-500 px-2 py-1 rounded text-sm text-white">
            +{drone.reward}
          </div>
        )}
      </div>
    </div>
  );
};

export default ARDrone;
import React, { useEffect, useRef } from 'react';
import { useLocationContext } from '../../context/LocationContext';
import { Player, LocationData } from '../../types/game';
import { locationService } from '../../services/LocationService';

interface ARViewProps {
  players: Player[];
}

const ARView: React.FC<ARViewProps> = ({ players }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { location, heading } = useLocationContext();

  useEffect(() => {
    console.log('ARView update - Players:', players);
    console.log('Current location:', location);
    console.log('Current heading:', heading);

    if (!canvasRef.current || !location || heading === null) {
      console.log('Missing required data:', {
        canvas: !!canvasRef.current,
        location: !!location,
        heading: heading
      });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Set canvas size to match viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Debug rectangle to ensure canvas is working
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(0, 0, 100, 100);

    // Draw debug info
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Players: ${players.length}`, 10, 20);
    ctx.fillText(`Heading: ${Math.round(heading)}°`, 10, 40);
    if (location) {
      ctx.fillText(`Lat: ${location.latitude.toFixed(6)}`, 10, 60);
      ctx.fillText(`Lng: ${location.longitude.toFixed(6)}`, 10, 80);
    }

    // Draw AR elements for each player
    players.forEach((player, index) => {
      console.log('Drawing player:', player);
      if (!player.location) {
        console.log('Player missing location:', player);
        return;
      }

      drawPlayerMarker(
        ctx, 
        location, 
        player.location, 
        heading, 
        canvas.width, 
        canvas.height,
        player.playerId,
        index
      );
    });

  }, [location, heading, players]);

  const drawPlayerMarker = (
    ctx: CanvasRenderingContext2D,
    userLocation: LocationData,
    playerLocation: LocationData,
    userHeading: number,
    width: number,
    height: number,
    playerId: string,
    index: number
  ) => {
    try {
      // Calculate relative position
      const bearing = locationService.calculateBearing(userLocation, playerLocation);
      const distance = locationService.calculateDistance(userLocation, playerLocation);
      
      console.log('Player marker calculation:', {
        playerId,
        bearing,
        distance,
        userHeading
      });

      // Convert to screen coordinates
      const relativeBearing = ((bearing - userHeading + 360) % 360) - 180;
      console.log('Relative bearing:', relativeBearing);

      // Even if outside FOV, draw for debugging
      const x = width / 2 + (relativeBearing / 60) * (width / 2);
      const y = height / 2;

      // Draw marker
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw debug info
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`P${index} - ${Math.round(distance)}m`, x, y - 25);
      ctx.fillText(`Bearing: ${Math.round(bearing)}°`, x, y - 10);
      ctx.fillText(`Relative: ${Math.round(relativeBearing)}°`, x, y + 35);

    } catch (error) {
      console.error('Error drawing player marker:', error);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
        style={{ background: 'transparent' }}
      />
      {/* Debug overlay */}
      <div className="absolute top-20 right-4 bg-black bg-opacity-50 p-2 text-white text-sm">
        <div>Players: {players.length}</div>
        <div>Heading: {heading?.toFixed(1)}°</div>
        <div>Location: {location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'No location'}</div>
      </div>
    </>
  );
};

export default ARView;
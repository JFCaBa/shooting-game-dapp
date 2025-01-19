import React, { useEffect, useRef } from 'react';
import { useLocationContext } from '../../context/LocationContext';
import { useGameContext } from '../../context/GameContext';
import { calculateDistance, calculateBearing } from '../../utils/maths';

const Radar = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { location } = useLocationContext();
  const { geoObjects } = useGameContext();

  const RADAR_RANGE = 500; // meters

  const getObjectColor = (type: string): string => {
    switch (type) {
      case 'weapon':
        return 'rgba(255, 0, 0, 0.8)'; // Red for weapons
      case 'crater':
        return 'rgba(255, 255, 0, 0.8)'; // Yellow for craters
      case 'target':
        return 'rgba(0, 255, 0, 0.8)'; // Green for targets
      default:
        return 'rgba(255, 255, 255, 0.8)';
    }
  };

  const drawGeoObjects = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ) => {
    if (!location) return;

    geoObjects.forEach((object) => {
      const objectLocation = {
        latitude: object.coordinate.latitude,
        longitude: object.coordinate.longitude,
        altitude: object.coordinate.altitude,
        accuracy: object.coordinate.accuracy,
      };

      const distance = calculateDistance(location, objectLocation);
      if (distance <= RADAR_RANGE) {
        const bearing = calculateBearing(location, objectLocation);
        const angle = (bearing * Math.PI) / 180;
        const normalizedDistance = distance / RADAR_RANGE;

        const x = centerX + Math.sin(angle) * (radius * normalizedDistance);
        const y = centerY - Math.cos(angle) * (radius * normalizedDistance);

        // Draw object dot with type-based color
        ctx.fillStyle = getObjectColor(object.type);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawNorthArrow = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    maxRadius: number
  ) => {
    // Draw arrow pointing up
    ctx.save();
    ctx.strokeStyle = '#00ff00'; // Bright green
    ctx.fillStyle = '#00ff00';
    ctx.lineWidth = 2;

    const arrowSize = maxRadius * 0.3; // Arrow size relative to radar
    const arrowTop = maxRadius * 0.1; // Position above radar

    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(centerX, arrowTop); // Arrow tip
    ctx.lineTo(centerX - arrowSize / 2, arrowTop + arrowSize); // Left corner
    ctx.lineTo(centerX + arrowSize / 2, arrowTop + arrowSize); // Right corner
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = canvas.width / 2 - 4;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw North arrow first
    drawNorthArrow(ctx, centerX, maxRadius);

    // Background circle
    ctx.fillStyle = 'rgba(0, 32, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    // Grid circles
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const radius = maxRadius * (i / 4);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cross lines
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // Geo objects
    drawGeoObjects(ctx, centerX, centerY, maxRadius);
  }, [location, geoObjects]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      className="rounded-full bg-black"
    />
  );
};

export default Radar;

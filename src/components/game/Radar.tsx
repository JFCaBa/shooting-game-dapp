import React, { useEffect, useRef } from 'react';
import { useLocationContext } from '../../context/LocationContext';
import { useGameContext } from '../../context/GameContext';
import { LocationService } from '../../services/LocationService';

const Radar = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { location, heading } = useLocationContext();
  const { geoObjects } = useGameContext();
  const locationService = LocationService.getInstance();

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
    if (!location) {
      // console.log('Radar: Missing location or heading', { location, heading });
      return;
    }

    geoObjects.forEach((object) => {
      const objectLocation = {
        latitude: object.coordinate.latitude,
        longitude: object.coordinate.longitude,
        altitude: object.coordinate.altitude,
        accuracy: object.coordinate.accuracy,
      };

      const distance = locationService.calculateDistance(
        location,
        objectLocation
      );
      if (distance <= RADAR_RANGE) {
        const bearing = locationService.calculateBearing(
          location,
          objectLocation
        );
        const relativeAngle =
          (((heading - bearing + 360) % 360) * Math.PI) / 180;
        const normalizedDistance = distance / RADAR_RANGE;

        const x =
          centerX + Math.sin(relativeAngle) * (radius * normalizedDistance);
        const y =
          centerY - Math.cos(relativeAngle) * (radius * normalizedDistance);

        // Draw object dot with type-based color
        ctx.fillStyle = getObjectColor(object.type);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Debug info
        // console.log(`Drawing object ${object.id}:`, {
        //   distance,
        //   bearing,
        //   relativeAngle: (relativeAngle * 180) / Math.PI,
        //   normalizedDistance,
        //   position: { x, y },
        //   location: objectLocation,
        // });
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawRadar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = canvas.width / 2;

      // Background
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

      // Scan line
      const time = Date.now() / 4000;
      const angle = (time * Math.PI * 2) % (Math.PI * 2);

      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * maxRadius,
        centerY + Math.sin(angle) * maxRadius
      );
      ctx.stroke();
    };

    const animate = () => {
      drawRadar();
      requestAnimationFrame(animate);
    };

    animate();
  }, [location, heading, geoObjects]);

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

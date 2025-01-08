import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocationContext } from '../context/LocationContext';
import { useGameContext } from '../context/GameContext';
import { createRoot } from 'react-dom/client';
import PlayerMarker from '../components/map/PlayerMarker';
import { WebSocketService } from '../services/WebSocketService';
import { MessageType } from '../types/game';

mapboxgl.accessToken = process.env.REACT_APP_MAP_BOX;

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: 'calc(100% - 170px)', // Deduct 80px from the total height
  position: 'relative',
  marginBottom: '170px', // Fixed spacing at the bottom
};

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const { location } = useLocationContext();
  const { players, playerId } = useGameContext();

  // Initialize map once
  useEffect(() => {
    if (!location || !mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [location.longitude, location.latitude],
      zoom: 15,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Add current player marker once
    const markerElement = document.createElement('div');
    const root = createRoot(markerElement);
    root.render(
      <PlayerMarker
        player={{
          playerId: playerId || 'current',
          location,
          heading: 0,
        }}
        isCurrentPlayer={true}
      />
    );

    markerRefs.current['current'] = new mapboxgl.Marker({
      element: markerElement,
    })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map);

    // Announce presence to get other players
    const wsService = WebSocketService.getInstance();
    wsService.send({
      type: MessageType.JOIN,
      playerId: playerId!,
      data: {
        location,
        playerId,
        kind: 'player',
        heading: 0,
      },
    });

    return () => {
      Object.values(markerRefs.current).forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []); // Empty dependency array - only run once

  // Handle other players updates - only when players array changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Update or create markers for other players
    players.forEach((player) => {
      if (!player.location || player.playerId === playerId) return;

      const markerId = player.playerId;
      const markerPosition = [
        player.location.longitude,
        player.location.latitude,
      ];

      if (markerRefs.current[markerId]) {
        markerRefs.current[markerId].setLngLat(markerPosition);
      } else {
        const markerElement = document.createElement('div');
        const root = createRoot(markerElement);
        root.render(<PlayerMarker player={player} isCurrentPlayer={false} />);

        markerRefs.current[markerId] = new mapboxgl.Marker({
          element: markerElement,
        })
          .setLngLat(markerPosition)
          .addTo(mapRef.current);
      }
    });

    // Remove markers for players who left
    Object.keys(markerRefs.current).forEach((markerId) => {
      if (
        markerId !== 'current' &&
        !players.find((p) => p.playerId === markerId)
      ) {
        markerRefs.current[markerId].remove();
        delete markerRefs.current[markerId];
      }
    });
  }, [players]); // Only react to players array changes

  if (!location) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-game-dark text-white">
        <div className="text-center">
          <p className="text-xl">Getting your location...</p>
          <p className="text-sm text-gray-400 mt-2">
            Check locations services if it takes too long
          </p>
        </div>
      </div>
    );
  }

  return <div id="map" ref={mapContainerRef} style={containerStyle}></div>;
};

export default Map;

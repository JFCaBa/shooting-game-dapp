import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocationContext } from '../context/LocationContext';
import { useGameContext } from '../context/GameContext';
import { createRoot } from 'react-dom/client';
import PlayerMarker from '../components/map/PlayerMarker';
import GeoObjectMarker from '../components/map/GeoObjectMarker';
import { WebSocketService } from '../services/WebSocketService';
import { MessageType } from '../types/game';

mapboxgl.accessToken = process.env.REACT_APP_MAP_BOX;

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: 'calc(100% - 170px)',
  position: 'relative',
  marginBottom: '170px',
};

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const geoObjectMarkerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const { location } = useLocationContext();
  const { players, playerId, geoObjects } = useGameContext();

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
      Object.values(geoObjectMarkerRefs.current).forEach((marker) =>
        marker.remove()
      );
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update current player position
  useEffect(() => {
    if (!location || !markerRefs.current['current']) return;

    markerRefs.current['current'].setLngLat([
      location.longitude,
      location.latitude,
    ]);

    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [location.longitude, location.latitude],
        duration: 1000,
      });
    }
  }, [location]);

  // Handle other players updates
  useEffect(() => {
    if (!mapRef.current) return;

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
  }, [players]);

  // Handle GeoObjects updates
  useEffect(() => {
    if (!mapRef.current) return;

    console.log('GeoObjects:', geoObjects); // Debugging geoObjects data

    geoObjects.forEach((geoObject) => {
      const markerId = geoObject.id;
      const markerPosition = [
        geoObject.coordinate.longitude,
        geoObject.coordinate.latitude,
      ];

      console.log(`Creating GeoObject: ${markerId}`, markerPosition);
      const markerElement = document.createElement('div');
      const root = createRoot(markerElement);
      root.render(
        <GeoObjectMarker
          geoObject={geoObject}
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: markerPosition,
                zoom: 18,
                duration: 1000,
              });
            }
          }}
        />
      );

      geoObjectMarkerRefs.current[markerId] = new mapboxgl.Marker({
        element: markerElement,
      })
        .setLngLat(markerPosition)
        .addTo(mapRef.current);
    });

    // Clean-up markers for removed GeoObjects
    Object.keys(geoObjectMarkerRefs.current).forEach((markerId) => {
      if (!geoObjects.find((obj) => obj.id === markerId)) {
        console.log(`Removing GeoObject: ${markerId}`);
        geoObjectMarkerRefs.current[markerId].remove();
        delete geoObjectMarkerRefs.current[markerId];
      }
    });
  }, [geoObjects]);

  useEffect(() => {
    if (!mapRef.current) return;

    const bounds = new mapboxgl.LngLatBounds();

    // Include current player location
    if (location) {
      bounds.extend([location.longitude, location.latitude]);
    }

    // Include other players' locations
    players.forEach((player) => {
      if (player.location && player.playerId !== playerId) {
        bounds.extend([player.location.longitude, player.location.latitude]);
      }
    });

    // Include GeoObjects locations
    geoObjects.forEach((geoObject) => {
      bounds.extend([
        geoObject.coordinate.longitude,
        geoObject.coordinate.latitude,
      ]);
    });

    // Fit map to the calculated bounds
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, {
        padding: 50, // Add padding around the edges of the viewport
        maxZoom: 15, // Optional: Limit the zoom level
        duration: 1000, // Animation duration in milliseconds
      });
    }
  }, [location, players, geoObjects]);

  if (!location) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-game-dark text-white">
        <div className="text-center">
          <p className="text-xl">Getting your location...</p>
          <p className="text-sm text-gray-400 mt-2">
            Check location services if it takes too long
          </p>
        </div>
      </div>
    );
  }

  return <div id="map" ref={mapContainerRef} style={containerStyle}></div>;
};

export default Map;

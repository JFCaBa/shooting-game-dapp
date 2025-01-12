import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocationContext } from '../context/LocationContext';
import { useGameContext } from '../context/GameContext';
import { createRoot } from 'react-dom/client';
import PlayerMarker from '../components/map/PlayerMarker';
import GeoObjectMarker from '../components/map/GeoObjectMarker';
import { MessageType } from '../types/game';
import { LocationStateManager } from '../services/LocationStateManager';

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
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const locationManager = LocationStateManager.getInstance();

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

    // Create custom follow button control
    const followButton = document.createElement('button');
    followButton.className = 'mapboxgl-ctrl-icon follow-button';
    followButton.style.cssText = `
      width: 20px;
      height: 20px;
      background: #fff;
      border: none;
      border-radius: 4px;
      padding: 2px;
      box-shadow: 0 0 0 2px rgba(0,0,0,.1);
      cursor: pointer;
      margin: 5px;
    `;
    followButton.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;">
        <path fill="${isFollowingUser ? '#4CAF50' : '#666'}" 
              d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
      </svg>
    `;

    const customControl = document.createElement('div');
    customControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    customControl.appendChild(followButton);

    map.addControl(
      {
        onAdd: () => customControl,
        onRemove: () => {},
      },
      'top-right'
    );

    followButton.onclick = () => {
      if (location && mapRef.current) {
        mapRef.current.easeTo({
          center: [location.longitude, location.latitude],
          duration: 500,
        });
      }
    };

    map.on('dragstart', () => setIsFollowingUser(false));
    mapRef.current = map;

    // Add current player marker
    if (location) {
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
    }

    // Set up location updates
    const unsubscribeLocation = locationManager.subscribeToLocation(
      (newLocation) => {
        if (markerRefs.current['current']) {
          markerRefs.current['current'].setLngLat([
            newLocation.longitude,
            newLocation.latitude,
          ]);
        }
      }
    );

    return () => {
      Object.values(markerRefs.current).forEach((marker) => marker.remove());
      Object.values(geoObjectMarkerRefs.current).forEach((marker) =>
        marker.remove()
      );
      unsubscribeLocation();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update other players
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

    // Cleanup removed players
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

  // Update GeoObjects
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers first
    Object.values(geoObjectMarkerRefs.current).forEach((marker) =>
      marker.remove()
    );
    geoObjectMarkerRefs.current = {};

    // Add new markers
    geoObjects.forEach((geoObject) => {
      const markerId = geoObject.id;
      const markerPosition = [
        geoObject.coordinate.longitude,
        geoObject.coordinate.latitude,
      ];

      const markerElement = document.createElement('div');
      const root = createRoot(markerElement);
      root.render(
        <GeoObjectMarker
          geoObject={geoObject}
          onClick={() => {
            if (mapRef.current) {
              setIsFollowingUser(false);
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
  }, [geoObjects]);

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

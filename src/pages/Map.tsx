// src/pages/Map.tsx
// Route: /map
// Displays the game map with player locations

import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import PlayerAnnotation from '../components/map/PlayerAnnotation';
import { Player } from '../types/game';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const Map = () => {
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [players, setPlayers] = useState<Player[]>([]);
  
  const { isLoaded } = useJsApiLoader({
    id: 'shooting-game-map',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    // Fetch and update players periodically
    const fetchPlayers = async () => {
      try {
        // Replace with your actual API call
        const response = await fetch('/api/players');
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };
  
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000); // Update every 5 seconds
  
    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="h-screen w-full relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        options={{
          disableDefaultUI: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#ffffff' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#000000' }, { lightness: 13 }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#000000' }]
            }
          ]
        }}
      >
        {/* Current player marker */}
        <Marker
          position={center}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4CAF50',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }}
        />

        {/* Other players */}
        {players.map((player) => (
          <PlayerAnnotation
            key={player.playerId}
            player={player}
            position={{
              lat: player.location.latitude,
              lng: player.location.longitude
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default Map;
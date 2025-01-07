import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocationContext } from '../context/LocationContext';

mapboxgl.accessToken = process.env.REACT_APP_MAP_BOX;

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative', // Ensure the map container is positioned relative to its parent
};

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const { location } = useLocationContext();

  useEffect(() => {
    const fetchLocationAndInitMap = async () => {
      try {
        // Get the current location
        const mapCenter = { lat: location.latitude, lng: location.longitude };
        setCenter(mapCenter);

        // Initialize the map
        if (mapContainerRef.current) {
          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [mapCenter.lng, mapCenter.lat],
            zoom: 12,
          });

          // Add navigation control (the +/- zoom buttons)
          map.addControl(new mapboxgl.NavigationControl(), 'top-right');

          // Add a marker to show the user's location
          new mapboxgl.Marker()
            .setLngLat([mapCenter.lng, mapCenter.lat])
            .addTo(map);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };

    fetchLocationAndInitMap();
  }, []);

  return <div id="map" ref={mapContainerRef} style={containerStyle}></div>;
};

export default Map;

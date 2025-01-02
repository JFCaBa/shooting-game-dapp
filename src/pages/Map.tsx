import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; 
import { locationService } from '../services/LocationService';

mapboxgl.accessToken = process.env.MAP_BOX || 'pk.eyJ1IjoiY2l0aXBsbGFlMDYwbTJvbWtnMnZ2bzRxdiIsImEiOiJjaXRpcG8yYWwwMDFnM29wZGNrbzNtdGczIn0.X3fHP5QJFX9wQl4yyVglqQ';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const Map = () => {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchLocationAndInitMap = async () => {
      try {
        // Get the current location
        const location = await locationService.getCurrentLocation();
        const mapCenter = { lat: location.latitude, lng: location.longitude };
        setCenter(mapCenter);
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    };

    fetchLocationAndInitMap();
  }, []);

  useEffect(() => {
    if (!center) return; // Prevent map initialization if center is not yet available

    // Initialize the Mapbox map
    const map = new mapboxgl.Map({
      container: 'map', // The ID of the div where the map will be rendered
      style: 'mapbox://styles/mapbox/streets-v11', // Map style (you can customize it)
      center: [center.lng, center.lat], // Set the initial center
      zoom: 15, // Set initial zoom level
    });

    // Add a marker for the current location
    new mapboxgl.Marker()
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    // Cleanup on component unmount
    return () => {
      map.remove();
    };
  }, [center]); // Re-run the effect when center changes

  return <div id="map" style={containerStyle}></div>;
};

export default Map;
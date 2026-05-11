import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';

const DriverLocationsMap = ({ locations = [] }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  mapboxgl.accessToken = ACCESS_TOKEN;

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!ACCESS_TOKEN) {
      console.error('Mapbox access token is missing');
      setLoading(false);
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [36.8219, -1.2921],
      zoom: 11,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setLoading(false);
      updateMap();
    });

    return () => {
      if (map.current) {
        markersRef.current.forEach((marker) => marker.remove());
        map.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const updateMap = () => {
    if (!map.current) return;

    clearMarkers();

    const bounds = new mapboxgl.LngLatBounds();
    let hasLocations = false;

    locations.forEach((location) => {
      if (!location.latitude || !location.longitude) return;

      hasLocations = true;
      const marker = new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<strong>${location.driver_name || 'Driver'}</strong><br/>Updated ${new Date(location.updated_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`
          )
        )
        .addTo(map.current);

      markersRef.current.push(marker);
      bounds.extend([location.longitude, location.latitude]);
    });

    if (hasLocations) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    } else {
      map.current.setCenter([36.8219, -1.2921]);
      map.current.setZoom(11);
    }
  };

  useEffect(() => {
    if (!map.current || loading) return;
    updateMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, loading]);

  return (
    <div className="relative h-full rounded-3xl overflow-hidden border border-gray-200 bg-white">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
          <p className="text-sm text-gray-600">Loading active driver locations...</p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      {!loading && locations.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 text-sm text-gray-700 font-semibold">
          No active driver locations available yet.
        </div>
      )}
    </div>
  );
};

export default DriverLocationsMap;

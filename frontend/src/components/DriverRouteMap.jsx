import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Clock, ExternalLink, Loader2, MapPin, Navigation } from 'lucide-react';

const DriverRouteMap = ({
  driverLocation,
  customerLocation,
  driverName = 'Driver',
  customerName = 'Customer',
  customerAddress = ''
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' });
  const markersRef = useRef([]);

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
      center: [customerLocation?.lng || 36.8219, customerLocation?.lat || -1.2921],
      zoom: 12,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setLoading(false);
      updateMap();
    });

    return () => {
      if (map.current) {
        markersRef.current.forEach(marker => marker.remove());
        map.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || loading) return;
    updateMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverLocation, customerLocation]);

  const clearRoute = () => {
    if (!map.current) return;
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const updateMap = async () => {
    if (!map.current) return;

    clearMarkers();
    clearRoute();

    const bounds = new mapboxgl.LngLatBounds();

    if (driverLocation) {
      const driverMarker = new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${driverName}</strong><br/>Driver location`))
        .addTo(map.current);
      markersRef.current.push(driverMarker);
      bounds.extend([driverLocation.lng, driverLocation.lat]);
    }

    if (customerLocation) {
      const customerMarker = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([customerLocation.lng, customerLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${customerName}</strong><br/>${customerAddress}`))
        .addTo(map.current);
      markersRef.current.push(customerMarker);
      bounds.extend([customerLocation.lng, customerLocation.lat]);
    }

    if (driverLocation && customerLocation && ACCESS_TOKEN) {
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation.lng},${driverLocation.lat};${customerLocation.lng},${customerLocation.lat}?steps=true&geometries=geojson&access_token=${ACCESS_TOKEN}`
        );
        const json = await query.json();

        if (json.code === 'Ok' && json.routes?.length) {
          const data = json.routes[0];
          const routeGeoJSON = {
            type: 'Feature',
            geometry: data.geometry
          };

          map.current.addSource('route', {
            type: 'geojson',
            data: routeGeoJSON
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#2563eb',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          setRouteInfo({
            distance: `${(data.distance / 1000).toFixed(1)} km`,
            duration: `${Math.round(data.duration / 60)} mins`
          });
        }
      } catch (error) {
        console.error('DriverRouteMap:', error);
      }
    }

    if (bounds.isEmpty()) {
      map.current.setCenter([customerLocation?.lng || 36.8219, customerLocation?.lat || -1.2921]);
      map.current.setZoom(12);
    } else {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  };

  const openInGoogleMaps = () => {
    if (!driverLocation || !customerLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.lat},${driverLocation.lng}&destination=${customerLocation.lat},${customerLocation.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative h-[420px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm text-gray-600">Loading live tracking...</p>
          </div>
        )}
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {driverLocation && customerLocation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-3xl border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center mb-2 text-emerald-600">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Distance</p>
            <p className="mt-2 text-lg font-black text-gray-900">{routeInfo.distance || 'Calculating...'}</p>
          </div>
          <div className="bg-white rounded-3xl border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center mb-2 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase tracking-widest text-gray-400">ETA</p>
            <p className="mt-2 text-lg font-black text-gray-900">{routeInfo.duration || 'Calculating...'}</p>
          </div>
          <button
            onClick={openInGoogleMaps}
            className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-4 hover:bg-slate-800 transition"
          >
            <div className="flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-semibold">Open in Google Maps</span>
            </div>
          </button>
        </div>
      )}

      <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-4 text-sm text-emerald-800">
        <div className="font-semibold">Live driver tracking</div>
        <p className="mt-1 text-gray-700 text-sm">
          {driverLocation && customerLocation
            ? `${driverName} is on route to ${customerName}. Refreshes automatically every 15 seconds.`
            : 'Waiting for the driver to share a live location. Please stay on this page for automatic updates.'}
        </p>
      </div>
    </div>
  );
};

export default DriverRouteMap;

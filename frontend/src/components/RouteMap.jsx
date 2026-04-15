import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Navigation, MapPin, Clock, ExternalLink, Loader2 } from 'lucide-react';

const RouteMap = ({
    job = {
        id: '#789',
        customerLocation: { lat: -1.2921, lng: 36.8219 },
        customerName: 'John Doe',
        customerAddress: 'Kilimani, Nairobi'
    }
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [driverLocation, setDriverLocation] = useState({ lat: -1.2864, lng: 36.8172 });
    const [routeInfo, setRouteInfo] = useState({ distance: 'Calculating...', duration: 'Calculating...' });
    const [loading, setLoading] = useState(true);

    const ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    mapboxgl.accessToken = ACCESS_TOKEN;

    // Get driver's current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setDriverLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                }
            );
        }
    }, []);

    useEffect(() => {
        if (!mapContainer.current) return;

        // Initialize map
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [driverLocation.lng, driverLocation.lat],
            zoom: 13,
            attributionControl: false
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            getRoute();
            setLoading(false);
        });

        // Cleanup
        return () => {
            if (map.current) map.current.remove();
        };
    }, [driverLocation, job.customerLocation]);

    const getRoute = async () => {
        try {
            const query = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation.lng},${driverLocation.lat};${job.customerLocation.lng},${job.customerLocation.lat}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
                { method: 'GET' }
            );
            const json = await query.json();
            if (json.code !== 'Ok') return;

            const data = json.routes[0];
            const route = data.geometry.coordinates;

            // Add route to map
            const geojson = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: route
                }
            };

            if (map.current.getSource('route')) {
                map.current.getSource('route').setData(geojson);
            } else {
                map.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: {
                        type: 'geojson',
                        data: geojson
                    },
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#3b82f6',
                        'line-width': 5,
                        'line-opacity': 0.75
                    }
                });
            }

            // Update UI
            setRouteInfo({
                distance: `${(data.distance / 1000).toFixed(1)} km`,
                duration: `${Math.round(data.duration / 60)} mins`
            });

            // Add Markers
            new mapboxgl.Marker({ color: '#3b82f6' }) // Driver
                .setLngLat([driverLocation.lng, driverLocation.lat])
                .setPopup(new mapboxgl.Popup().setHTML('<b>Driver (You)</b>'))
                .addTo(map.current);

            new mapboxgl.Marker({ color: '#ef4444' }) // Customer
                .setLngLat([job.customerLocation.lng, job.customerLocation.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<b>${job.customerName}</b><br/>${job.customerAddress}`))
                .addTo(map.current);

            // Fit bounds
            const bounds = new mapboxgl.LngLatBounds()
                .extend([driverLocation.lng, driverLocation.lat])
                .extend([job.customerLocation.lng, job.customerLocation.lat]);

            map.current.fitBounds(bounds, { padding: 50 });

        } catch (error) {
            console.error('Error fetching Mapbox route:', error);
        }
    };

    const openInGoogleMaps = () => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.lat},${driverLocation.lng}&destination=${job.customerLocation.lat},${job.customerLocation.lng}&travelmode=driving`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg relative h-[400px]">
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Loading high-accuracy routes...</p>
                    </div>
                )}
                <div ref={mapContainer} className="w-full h-full" />
            </div>

            {/* Route info */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm text-center transform transition hover:scale-[1.02]">
                    <MapPin className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Distance</p>
                    <p className="font-bold text-gray-900">{routeInfo.distance}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center transform transition hover:scale-[1.02]">
                    <Clock className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">ETA</p>
                    <p className="font-bold text-gray-900">{routeInfo.duration}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm text-center transform transition hover:scale-[1.02]">
                    <button
                        onClick={openInGoogleMaps}
                        className="w-full h-full flex flex-col items-center justify-center group"
                    >
                        <ExternalLink className="w-6 h-6 text-purple-600 mb-1 group-hover:scale-110 transition" />
                        <p className="text-xs text-purple-600 font-bold">Open Maps</p>
                    </button>
                </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <div className="bg-emerald-600 text-white rounded-full p-1.5 mt-0.5">
                    <Navigation className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-bold text-emerald-900">Mapbox Logistics Active</p>
                    <p className="text-xs text-emerald-700 italic">Using professional vector mapping. Cost-effective and highly accurate.</p>
                </div>
            </div>
        </div>
    );
};

export default RouteMap;

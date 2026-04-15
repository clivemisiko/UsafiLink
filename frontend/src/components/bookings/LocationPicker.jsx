import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, MapPin } from 'lucide-react';

const LocationPicker = ({ onLocationSelect, initialPosition }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);
    const [loading, setLoading] = useState(true);
    const [position, setPosition] = useState(initialPosition || { lat: -1.2921, lng: 36.8219 });

    const ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    mapboxgl.accessToken = ACCESS_TOKEN;

    useEffect(() => {
        if (!mapContainer.current) return;

        // Initialize map
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [position.lng, position.lat],
            zoom: 14,
            attributionControl: false
        });

        // Add controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-right');

        // Initialize Marker
        marker.current = new mapboxgl.Marker({
            draggable: true,
            color: '#3b82f6'
        })
            .setLngLat([position.lng, position.lat])
            .addTo(map.current);

        marker.current.on('dragend', () => {
            const lngLat = marker.current.getLngLat();
            updatePosition({ lat: lngLat.lat, lng: lngLat.lng });
        });

        map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            marker.current.setLngLat([lng, lat]);
            updatePosition({ lat, lng });
        });

        map.current.on('load', () => {
            setLoading(false);
        });

        // Cleanup
        return () => {
            if (map.current) map.current.remove();
        };
    }, []);

    const updatePosition = (newPos) => {
        setPosition(newPos);
        if (onLocationSelect) {
            onLocationSelect(newPos);
        }
    };

    // Try to get user's current location on mount if no initial position
    useEffect(() => {
        if (!initialPosition && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    updatePosition(newPos);
                    if (map.current) {
                        map.current.flyTo({ center: [newPos.lng, newPos.lat], zoom: 15 });
                        marker.current.setLngLat([newPos.lng, newPos.lat]);
                    }
                },
                () => console.log('Geolocation precision denied')
            );
        }
    }, [initialPosition]);

    return (
        <div className="h-64 mt-2 rounded-xl overflow-hidden border border-gray-300 relative shadow-inner">
            {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            )}
            <div ref={mapContainer} className="w-full h-full" />
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg text-[10px] font-bold text-gray-700 border border-gray-100 uppercase tracking-tighter">
                <span className="text-emerald-600">Tip:</span> Drag marker or click map
            </div>
        </div>
    );
};

export default LocationPicker;

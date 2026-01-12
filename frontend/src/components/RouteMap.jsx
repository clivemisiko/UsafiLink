import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Navigation, MapPin, Clock, ExternalLink } from 'lucide-react';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Routing component
const RoutingMachine = ({ driverLocation, customerLocation, setRouteInfo }) => {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // Remove existing routing control
        if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
        }

        // Create new routing control
        const driverLatLng = L.latLng(driverLocation.lat, driverLocation.lng);
        const customerLatLng = L.latLng(customerLocation.lat, customerLocation.lng);

        routingControlRef.current = L.Routing.control({
            waypoints: [driverLatLng, customerLatLng],
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: 'driving'
            }),
            routeWhileDragging: false,
            showAlternatives: false,
            addWaypoints: false,
            fitSelectedRoutes: true, // Automatically zoom to fit both points
            lineOptions: {
                styles: [{ color: '#3b82f6', opacity: 0.8, weight: 5 }]
            },
            createMarker: () => null,
            show: false,
        }).addTo(map);

        // Auto-fit bounds manually if routing doesn't do it instantly
        const bounds = L.latLngBounds([driverLatLng, customerLatLng]);
        map.fitBounds(bounds, { padding: [50, 50] });

        // Get route information
        routingControlRef.current.on('routesfound', (e) => {
            const route = e.routes[0];
            const distance = (route.summary.totalDistance / 1000).toFixed(1); // km
            const duration = Math.round(route.summary.totalTime / 60); // minutes
            setRouteInfo({ distance: `${distance} km`, duration: `${duration} mins` });
        });

        return () => {
            if (routingControlRef.current) {
                map.removeControl(routingControlRef.current);
            }
        };
    }, [map, driverLocation, customerLocation, setRouteInfo]);

    return null;
};

const RouteMap = ({
    job = {
        id: '#789',
        customerLocation: { lat: -1.2921, lng: 36.8219 }, // Nairobi center default
        customerName: 'John Doe',
        customerAddress: 'Kilimani, Nairobi'
    }
}) => {
    const [driverLocation, setDriverLocation] = useState({ lat: -1.2864, lng: 36.8172 }); // Westlands default
    const [routeInfo, setRouteInfo] = useState({ distance: 'Calculating...', duration: 'Calculating...' });

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
                    // Use default location if geolocation fails
                }
            );
        }
    }, []);

    const openInGoogleMaps = () => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.lat},${driverLocation.lng}&destination=${job.customerLocation.lat},${job.customerLocation.lng}&travelmode=driving`;
        window.open(url, '_blank');
    };

    // Center point between driver and customer
    const center = [
        (driverLocation.lat + job.customerLocation.lat) / 2,
        (driverLocation.lng + job.customerLocation.lng) / 2
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm" style={{ height: '400px' }}>
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                >
                    {/* OpenStreetMap tiles - completely free! */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Driver marker */}
                    <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-blue-600">Your Location</p>
                                <p className="text-xs text-gray-600">Driver</p>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Customer marker */}
                    <Marker position={[job.customerLocation.lat, job.customerLocation.lng]} icon={customerIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-red-600">{job.customerName}</p>
                                <p className="text-xs text-gray-600">{job.customerAddress}</p>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Routing */}
                    <RoutingMachine
                        driverLocation={driverLocation}
                        customerLocation={job.customerLocation}
                        setRouteInfo={setRouteInfo}
                    />
                </MapContainer>
            </div>

            {/* Route info */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <MapPin className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Distance</p>
                    <p className="font-bold text-blue-900">{routeInfo.distance}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                    <Clock className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">ETA</p>
                    <p className="font-bold text-green-900">{routeInfo.duration}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <button
                        onClick={openInGoogleMaps}
                        className="w-full flex flex-col items-center justify-center hover:bg-purple-100 rounded transition"
                    >
                        <ExternalLink className="w-5 h-5 text-purple-600 mb-1" />
                        <p className="text-xs text-purple-600 font-semibold">Open Maps</p>
                    </button>
                </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <div className="bg-green-500 text-white rounded-full p-1 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-semibold text-green-900">100% Free Navigation</p>
                    <p className="text-xs text-green-700">Using OpenStreetMap & OSRM - No API keys or charges!</p>
                </div>
            </div>
        </div>
    );
};

export default RouteMap;

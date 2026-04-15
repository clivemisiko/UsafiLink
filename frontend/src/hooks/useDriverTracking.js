import { useEffect, useRef, useState, useCallback } from 'react';
import { trackingAPI } from '../api/tracking';
import { toast } from 'react-hot-toast';

export const useDriverTracking = () => {
    const [isTracking, setIsTracking] = useState(false);
    const watchIdRef = useRef(null);
    const lastUpdateRef = useRef(0);

    // Configuration
    const UPDATE_INTERVAL_MS = 10000; // Update every 10 seconds

    const startTracking = useCallback(() => {
        // Double check role
        const role = localStorage.getItem('user_role');
        if (role !== 'driver') return;

        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        if (watchIdRef.current) return; // Already tracking

        setIsTracking(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const now = Date.now();
                if (now - lastUpdateRef.current < UPDATE_INTERVAL_MS) {
                    return; // Too soon
                }

                const { latitude, longitude, heading, speed, accuracy } = position.coords;

                try {
                    await trackingAPI.updateLocation({
                        latitude,
                        longitude,
                        heading: heading || 0,
                        speed: speed || 0,
                        accuracy: accuracy || 0
                    });
                    lastUpdateRef.current = now;
                    console.log("Location updated:", latitude, longitude);
                } catch (error) {
                    console.error("Failed to update location:", error);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                // toast.error("Location tracking failed. Please enable GPS.");
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }, []);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    }, []);

    useEffect(() => {
        return () => stopTracking();
    }, []);

    return { startTracking, stopTracking, isTracking };
};

import axiosInstance from './axiosConfig';

export const trackingAPI = {
    // Update driver location
    updateLocation: async (locationData) => {
        // locationData should contain { latitude, longitude, heading, speed, accuracy }
        const response = await axiosInstance.post('/tracking/locations/', locationData);
        return response.data;
    },

    // Get nearby drivers
    getNearbyDrivers: async (lat, lon, radiusKm = 50) => {
        const response = await axiosInstance.get('/tracking/locations/nearby/', {
            params: { lat, lon, radius_km: radiusKm }
        });
        return response.data;
    },

    // Get specific driver location by driver id
    getDriverLocation: async (driverId) => {
        const response = await axiosInstance.get('/tracking/locations/', {
            params: { driver_id: driverId }
        });
        const data = response.data;
        const results = Array.isArray(data) ? data : data.results || data.data || [];
        return results.length > 0 ? results[0] : null;
    },

    // Get all driver locations (admin / customer view)
    getAllDriverLocations: async () => {
        const response = await axiosInstance.get('/tracking/locations/');
        const data = response.data;
        return Array.isArray(data) ? data : data.results || data.data || [];
    }
};

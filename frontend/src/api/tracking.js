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

    // Get specific driver location
    getDriverLocation: async (driverId) => {
        // This assumes we might check specific driver location if we had an ID
        // Currently the backend filters by user, but we might want this for customers tracking their driver
        // For now we can assume customers will get driver location via booking status updates or similar
        // But tracking/locations endpoint returns list based on permissions
        const response = await axiosInstance.get('/tracking/locations/');
        return response.data;
    }
};

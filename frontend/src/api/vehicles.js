import axiosInstance from './axiosConfig';

export const vehiclesAPI = {
    getAll: async () => {
        const response = await axiosInstance.get('/vehicles/vehicles/');
        return response.data;
    },

    create: async (data) => {
        const response = await axiosInstance.post('/vehicles/vehicles/', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosInstance.patch(`/vehicles/vehicles/${id}/`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosInstance.delete(`/vehicles/vehicles/${id}/`);
        return response.data;
    },

    assignDriver: async (vehicleId, driverId) => {
        const response = await axiosInstance.post(`/vehicles/vehicles/${vehicleId}/assign_driver/`, { driver_id: driverId });
        return response.data;
    },

    transferDriver: async (vehicleId, data) => {
        const response = await axiosInstance.post(`/vehicles/vehicles/${vehicleId}/transfer_driver/`, data);
        return response.data;
    },

    getDriverMetrics: async () => {
        const response = await axiosInstance.get('/vehicles/vehicles/driver_metrics/');
        return response.data;
    },

    getExpiringRegistrations: async () => {
        const response = await axiosInstance.get('/vehicles/vehicles/expiring_registrations/');
        return response.data;
    }
};


import axiosInstance from './axiosConfig';

export const vehiclesAPI = {
    getAll: async () => {
        const response = await axiosInstance.get('/vehicles/');
        return response.data;
    },

    create: async (data) => {
        const response = await axiosInstance.post('/vehicles/', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axiosInstance.patch(`/vehicles/${id}/`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosInstance.delete(`/vehicles/${id}/`);
        return response.data;
    },

    assignDriver: async (vehicleId, driverId) => {
        const response = await axiosInstance.post(`/vehicles/${vehicleId}/assign_driver/`, { driver_id: driverId });
        return response.data;
    }
};

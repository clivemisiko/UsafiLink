import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Calendar, Droplets, Phone } from 'lucide-react';
import { bookingsAPI } from '../../api/bookings';
import { toast } from 'react-hot-toast';
import LocationPicker from './LocationPicker';

const bookingSchema = z.object({
  location_name: z.string().min(3, 'Location name is required'),
  address: z.string().min(3, 'Address is required').trim(),
  service_type: z.enum(['septic', 'pit_latrine', 'grease_trap', 'other']),
  tank_size: z.enum(['1000', '2000', '3000', '5000', '10000']),
  scheduled_date: z.string().min(1, 'Date is required'),
  scheduled_time: z.string().min(1, 'Time is required'),
  special_instructions: z.string().optional(),
});

const BookingForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      service_type: 'septic',
      tank_size: '1000',
    },
  });

  const serviceType = watch('service_type');
  const tankSize = watch('tank_size');

  // Calculate price when service type or tank size changes
  React.useEffect(() => {
    const calculateEstimate = async () => {
      if (serviceType && tankSize) {
        try {
          const estimate = await bookingsAPI.getPriceEstimate({
            service_type: serviceType,
            tank_size: tankSize,
          });
          setPriceEstimate(estimate);
        } catch (error) {
          console.error('Failed to get price estimate:', error);
        }
      }
    };
    calculateEstimate();
  }, [serviceType, tankSize]);

  const handleLocationSelect = useCallback((pos) => {
    setCoordinates(pos);
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Combine date and time
      const scheduledDateTime = `${data.scheduled_date}T${data.scheduled_time}:00`;

      const bookingData = {
        ...data,
        scheduled_date: scheduledDateTime,
        latitude: coordinates.lat || -1.2921, // Default Nairobi coords
        longitude: coordinates.lng || 36.8219,
        estimated_price: priceEstimate?.total || 0,
      };

      const response = await bookingsAPI.createBooking(bookingData);
      toast.success('Booking created successfully!');
      onSuccess?.(response);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Book Exhauster Service</h2>

        {/* Location Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name *
              </label>
              <input
                type="text"
                {...register('location_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Home, Office"
              />
              {errors.location_name && (
                <p className="mt-1 text-sm text-red-600">{errors.location_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address *
              </label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Street, Area, City"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exact Map Location (Click to adjust)
            </label>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
            />
            <p className="mt-1 text-xs text-gray-500 italic">
              * Help the driver find you by pinning your exact location above.
            </p>
          </div>
        </div>

        {/* Service Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Service Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type *
              </label>
              <select
                {...register('service_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="septic">Septic Tank</option>
                <option value="pit_latrine">Pit Latrine</option>
                <option value="grease_trap">Grease Trap</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tank Size *
              </label>
              <select
                {...register('tank_size')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="1000">1000 Liters</option>
                <option value="2000">2000 Liters</option>
                <option value="3000">3000 Liters</option>
                <option value="5000">5000 Liters</option>
                <option value="10000">10000 Liters</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Service
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                {...register('scheduled_date')}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.scheduled_date && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduled_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <select
                {...register('scheduled_time')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Time</option>
                <option value="08:00">08:00 AM</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">01:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
              </select>
              {errors.scheduled_time && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduled_time.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Instructions (Optional)
          </label>
          <textarea
            {...register('special_instructions')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Gate code, parking instructions, specific requirements..."
          />
        </div>

        {/* Price Estimate */}
        {priceEstimate && (
          <div className="mb-6 p-4 bg-primary-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Price Estimate</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price:</span>
                <span className="font-medium">KES {priceEstimate.base_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tank Size ({tankSize}L):</span>
                <span className="font-medium">KES {priceEstimate.tank_charge}</span>
              </div>
              {priceEstimate.distance_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance Charge:</span>
                  <span className="font-medium">KES {priceEstimate.distance_charge}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Estimate:</span>
                  <span className="text-primary-600">KES {priceEstimate.total}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Final price may vary based on actual conditions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Book Now'
          )}
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
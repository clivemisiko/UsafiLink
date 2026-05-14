import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Calendar, Droplets } from 'lucide-react';
import { bookingsAPI } from '../../api/bookings';
import { toast } from 'react-hot-toast';
import LocationPicker from '../maps/LocationPicker';
import DriverSlotPicker from './DriverSlotPicker';
import { useLocation } from 'react-router-dom';

const bookingSchema = z.object({
  location_name: z.string().min(3, 'Location name is required'),
  address: z.string().min(3, 'Address is required').trim(),
  service_type: z.enum(['septic', 'pit_latrine', 'grease_trap', 'other']),
  tank_size: z.enum(['1000', '2000', '3000', '5000', '10000']),
  special_instructions: z.string().optional(),
});

const getBookingErrorMessage = (error) => {
  const data = error.response?.data;

  if (!data) return 'Failed to create booking';
  if (typeof data === 'string') {
    return data.trim().startsWith('<!doctype html') || data.trim().startsWith('<html')
      ? 'Server error while creating booking. Please try again.'
      : data;
  }
  if (data.detail) return data.detail;

  const firstFieldError = Object.values(data)
    .flat()
    .find((message) => typeof message === 'string' && message.trim());

  return firstFieldError || 'Failed to create booking';
};

const BookingForm = ({ onSuccess }) => {
  const location = useLocation();
  const preFilledData = location.state || {};

  const [loading, setLoading] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [selectedSlot, setSelectedSlot] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      service_type: 'septic',
      tank_size: preFilledData.tankSize || '1000',
      location_name: preFilledData.location || '',
      address: preFilledData.location || '',
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
    if (!coordinates || (coordinates.lat === null && coordinates.lng === null)) {
      toast.error('Please select your exact location on the map');
      return;
    }

    if (!selectedSlot) {
      toast.error('Please select an available time slot');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        ...data,
        slot_id: selectedSlot.id,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        estimated_price: priceEstimate?.total || 0,
      };

      const response = await bookingsAPI.createBooking(bookingData);
      toast.success('Booking created successfully!');
      onSuccess?.(response);
    } catch (error) {
      toast.error(getBookingErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 w-full min-w-0">
      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-slate-900">Location Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location Name *</label>
            <input
              type="text"
              {...register('location_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Home, Office"
            />
            {errors.location_name && (
              <p className="mt-1 text-sm text-red-600">{errors.location_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Address *</label>
            <input
              type="text"
              {...register('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Street, Area, City"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Exact Map Location (Click to adjust)</label>
          <LocationPicker onLocationSelect={handleLocationSelect} />
          <p className="mt-2 text-sm text-slate-500 italic">
            Help the driver find you by pinning your exact location on the map.
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Droplets className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-semibold text-slate-900">Service Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Type *</label>
            <select
              {...register('service_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="septic">Septic Tank</option>
              <option value="pit_latrine">Pit Latrine</option>
              <option value="grease_trap">Grease Trap</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tank Size *</label>
            <select
              {...register('tank_size')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="1000">1000 Liters</option>
              <option value="2000">2000 Liters</option>
              <option value="3000">3000 Liters</option>
              <option value="5000">5000 Liters</option>
              <option value="10000">10000 Liters</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Calendar className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900">Select Driver & Time Slot</h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Pick a date to see available drivers and their open time slots. Booked slots are shown but cannot be selected.
        </p>

        <DriverSlotPicker onSlotSelect={setSelectedSlot} selectedSlot={selectedSlot} />

        {selectedSlot && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-3xl">
            <p className="text-sm text-emerald-800 font-medium">
              Selected: {selectedSlot.driver_name || `Driver #${selectedSlot.driver_id}`} — {selectedSlot.label}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">i</span>
          <h3 className="text-lg font-semibold text-slate-900">Additional details</h3>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-2">Special Instructions (Optional)</label>
        <textarea
          {...register('special_instructions')}
          rows={4}
          className="w-full px-3 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g., Gate code, parking instructions, specific requirements..."
        />
      </section>

      {priceEstimate && (
        <section className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-900">Price Estimate</h4>
            <span className="w-fit rounded-full bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">
              Estimated total
            </span>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-4">
              <span>Base Price</span>
              <span className="font-medium text-right">KES {priceEstimate.base_price}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span>Tank Charge</span>
              <span className="font-medium text-right">KES {priceEstimate.tank_charge}</span>
            </div>
            {priceEstimate.distance_charge > 0 && (
              <div className="flex items-start justify-between gap-4">
                <span>Distance Charge</span>
                <span className="font-medium text-right">KES {priceEstimate.distance_charge}</span>
              </div>
            )}
            <div className="border-t border-emerald-200 pt-3 flex items-start justify-between gap-4 text-lg font-bold">
              <span>Total Estimate</span>
              <span className="text-emerald-900 text-right">KES {priceEstimate.total}</span>
            </div>
            <p className="text-sm text-slate-600">Final price may vary based on actual conditions.</p>
          </div>
        </section>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-3xl font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    </form>
  );
};

export default BookingForm;

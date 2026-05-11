import React, { useState, useEffect, useCallback } from 'react';
import { bookingsAPI } from '../../api/bookings';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const DriverSlotPicker = ({ onSlotSelect, selectedSlot }) => {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupedSlots, setGroupedSlots] = useState({});

  const fetchSlots = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const data = await bookingsAPI.getAvailableSlots(date);
      setSlots(data);

      // Group by driver
      const grouped = {};
      data.forEach((slot) => {
        const driverId = slot.driver_id;
        if (!grouped[driverId]) {
          grouped[driverId] = {
            driver_id: driverId,
            driver_name: slot.driver_name || `Driver #${driverId}`,
            driver_phone: slot.driver_phone,
            slots: [],
          };
        }
        grouped[driverId].slots.push(slot);
      });
      setGroupedSlots(grouped);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const today = new Date().toISOString().split('T')[0];

  const getStatusBadge = (slot) => {
    if (slot.status === 'available') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Available
        </span>
      );
    }
    if (slot.status === 'booked') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Booked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        {slot.status}
      </span>
    );
  };

  const isSelected = (slot) => selectedSlot?.id === slot.id;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Calendar className="w-4 h-4 inline mr-1" />
          Select Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={today}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          <span className="ml-2 text-sm text-gray-600">Loading slots...</span>
        </div>
      )}

      {!loading && date && Object.keys(groupedSlots).length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No available slots for this date.</p>
          <p className="text-sm mt-1">Try selecting a different date.</p>
        </div>
      )}

      {!loading &&
        Object.values(groupedSlots).map((driver) => (
          <div
            key={driver.driver_id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-800">{driver.driver_name}</span>
              {driver.driver_phone && (
                <span className="text-xs text-gray-500">({driver.driver_phone})</span>
              )}
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {driver.slots.map((slot) => {
                const selected = isSelected(slot);
                const available = slot.status === 'available';
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => {
                      if (available) {
                        onSlotSelect(slot);
                      }
                    }}
                    disabled={!available}
                    className={`
                      relative p-3 rounded-lg border text-left transition-all
                      ${selected
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : available
                        ? 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 cursor-pointer'
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {slot.label}
                      </span>
                    </div>
                    <div className="mt-1">{getStatusBadge(slot)}</div>
                    {slot.note && (
                      <p className="text-xs text-gray-500 mt-1">{slot.note}</p>
                    )}
                    {selected && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="w-4 h-4 text-primary-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
};

export default DriverSlotPicker;

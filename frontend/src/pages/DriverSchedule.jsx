import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldAlert,
  Truck
} from 'lucide-react';
import { bookingsAPI } from '../api/bookings';
import { authAPI } from '../api/auth';
import { toast } from 'react-hot-toast';

const DriverSchedule = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    date: '',
    start_time: '08:00',
    end_time: '10:00',
    note: '',
  });

  const isDriverApproved = user?.is_driver_approved === true;

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingsAPI.getDriverSlots();
      setSlots(data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      toast.error('Failed to load your schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchSlots();
  }, [fetchUserData, fetchSlots]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!isDriverApproved) {
      toast.error('Your account must be approved by an admin before you can create slots.');
      return;
    }
    if (!formData.date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.start_time >= formData.end_time) {
      toast.error('End time must be after start time');
      return;
    }

    setSubmitting(true);
    try {
      await bookingsAPI.createDriverSlot(formData);
      toast.success('Slot created successfully!');
      setShowForm(false);
      setFormData({ date: '', start_time: '08:00', end_time: '10:00', note: '' });
      fetchSlots();
    } catch (error) {
      const msg = error.response?.data?.detail || error.response?.data?.[0] || 'Failed to create slot';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    setDeletingId(id);
    try {
      await bookingsAPI.deleteDriverSlot(id);
      toast.success('Slot deleted');
      fetchSlots();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to delete slot';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      booked: 'bg-blue-100 text-blue-700 border-blue-200',
      in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
      completed: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const icons = {
      available: CheckCircle2,
      booked: CalendarIcon,
      in_progress: Clock,
      completed: CheckCircle2,
    };
    const Icon = icons[status] || AlertCircle;
    const style = styles[status] || 'bg-red-100 text-red-700 border-red-200';
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${style}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const groupByDate = (items) => {
    const grouped = {};
    items.forEach((slot) => {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push(slot);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className="w-full pb-20">
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center shadow-lg shadow-sage-muted">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">My Schedule</h1>
              <p className="text-xs text-slate-500">Create availability slots for customers</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!isDriverApproved}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Slot'}
          </button>
        </div>

        {!isDriverApproved && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800">Account Pending Approval</h3>
              <p className="text-sm text-amber-700 mt-1">
                Your driver account must be approved by an admin before you can create availability slots.
              </p>
            </div>
          </div>
        )}

      {showForm && (
        <form
          onSubmit={handleCreateSlot}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Create New Slot</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date *</label>
              <input
                type="date"
                required
                min={today}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Time *</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Time *</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Note (Optional)</label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="e.g., Morning shift, available for bulk jobs..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2 font-semibold shadow-sm"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Slot
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
          <span className="ml-3 text-slate-500 font-medium">Loading your schedule...</span>
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CalendarIcon className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Slots Yet</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            You haven't created any availability slots. Click "Add Slot" to let customers book you for specific times.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupByDate(slots).map(([date, dateSlots]) => (
            <div key={date} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <CalendarIcon className="w-4 h-4 text-slate-500" />
                </div>
                <span className="font-bold text-slate-900">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-xs font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full ml-auto">
                  {dateSlots.length} slot{dateSlots.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {dateSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </div>
                      <div>{getStatusBadge(slot.status)}</div>
                      {slot.note && (
                        <span className="text-sm text-slate-500 hidden sm:inline bg-slate-50 px-3 py-1 rounded-lg">{slot.note}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.status === 'available' && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={deletingId === slot.id}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete slot"
                        >
                          {deletingId === slot.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default DriverSchedule;

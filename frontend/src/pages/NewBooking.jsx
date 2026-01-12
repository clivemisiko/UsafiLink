import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BookingForm from '../components/bookings/BookingForm';

const NewBooking = () => {
  const handleSuccess = (bookingData) => {
    console.log('Booking created:', bookingData);
    // In real app, you'd redirect to booking details
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link
              to="/bookings"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Bookings
            </Link>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">New Booking</h1>
              <p className="mt-1 text-sm text-gray-600">
                Schedule a new exhauster service
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingForm onSuccess={handleSuccess} />
      </main>
    </div>
  );
};

export default NewBooking;
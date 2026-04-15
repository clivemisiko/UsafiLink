import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';

const DriverRatings = ({ driverId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDriverRatings();
  }, [driverId]);

  const fetchDriverRatings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/bookings/bookings/driver_ratings/`, {
        params: { driver_id: driverId }
      });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading ratings...</div>;
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">{error}</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No rating data available</div>;
  }

  const { driver, statistics, recent_ratings } = data;
  const { average_rating, total_ratings, distribution } = statistics;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      {/* Driver Header */}
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold">{driver.name}</h2>
        <p className="text-gray-600">@{driver.username}</p>
        {driver.phone && <p className="text-gray-600">{driver.phone}</p>}
      </div>

      {/* Overall Rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current Rating */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">{average_rating}</div>
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(average_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-700">
              Based on <strong>{total_ratings}</strong> ratings
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="w-8 text-sm font-medium">{stars}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full"
                    style={{
                      width: `${total_ratings > 0 ? (distribution[`${stars}_stars`] / total_ratings) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="w-12 text-sm text-gray-600 text-right">
                  {distribution[`${stars}_stars`]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Ratings */}
      <div className="border-t pt-6">
        <h3 className="text-xl font-bold mb-4">Recent Ratings</h3>
        {recent_ratings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No ratings yet</p>
        ) : (
          <div className="space-y-4">
            {recent_ratings.map((rating) => (
              <div key={rating.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{rating.customer_name}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rating.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {rating.score}/5
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </div>
                </div>
                {rating.comment && (
                  <p className="text-gray-700 text-sm mt-2">{rating.comment}</p>
                )}
                {rating.is_reviewed_by_admin && (
                  <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-3">
                    <p className="text-xs text-blue-900 font-semibold mb-1">
                      Admin Response:
                    </p>
                    <p className="text-sm text-blue-800">{rating.admin_response}</p>
                  </div>
                )}
                {rating.is_flagged && (
                  <div className="mt-2 bg-red-50 border-l-4 border-red-400 p-2">
                    <p className="text-xs text-red-800">
                      <strong>Flagged:</strong> {rating.flag_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRatings;

import React, { useState, useEffect } from 'react';
import { Star, X, Check } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';

const AdminRatingsPanel = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    unreviewed: false,
    flagged: false,
    driver_id: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRating, setSelectedRating] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [flagData, setFlagData] = useState({
    is_flagged: false,
    flag_reason: '',
  });
  const [reviewLoading, setReviewLoading] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchRatings();
  }, [filters, currentPage]);

  const fetchRatings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        ...filters,
      };
      const response = await axiosInstance.get('/bookings/bookings/all_ratings/', { params });
      setRatings(response.data.results);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFilters((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setCurrentPage(1);
  };

  const handleReviewClick = (rating) => {
    setSelectedRating(rating);
    setAdminResponse(rating.admin_response || '');
    setFlagData({
      is_flagged: rating.is_flagged,
      flag_reason: rating.flag_reason || '',
    });
  };

  const handleSubmitReview = async () => {
    if (!selectedRating) return;

    setReviewLoading(true);
    try {
      await axiosInstance.post('/bookings/bookings/review_rating/', {
        rating_id: selectedRating.id,
        admin_response: adminResponse.trim(),
        is_flagged: flagData.is_flagged,
        flag_reason: flagData.flag_reason.trim(),
      });

      setSelectedRating(null);
      setAdminResponse('');
      setFlagData({ is_flagged: false, flag_reason: '' });
      fetchRatings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Rating Reviews</h1>
        <p className="text-gray-600 mt-1">Manage and respond to customer ratings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h2 className="font-bold text-lg">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="unreviewed"
              checked={filters.unreviewed}
              onChange={handleFilterChange}
              className="w-4 h-4 rounded"
            />
            <span>Unreviewed Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="flagged"
              checked={filters.flagged}
              onChange={handleFilterChange}
              className="w-4 h-4 rounded"
            />
            <span>Flagged Only</span>
          </label>
          <input
            type="number"
            name="driver_id"
            placeholder="Driver ID (optional)"
            value={filters.driver_id}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Ratings List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">Loading ratings...</div>
        ) : ratings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No ratings found</div>
        ) : (
          <div className="divide-y">
            {ratings.map((rating) => (
              <div key={rating.id} className="p-4 hover:bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="font-semibold">{rating.customer_name}</p>
                    <p className="text-sm text-gray-600">→ {rating.driver_name}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rating.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {rating.is_reviewed_by_admin ? (
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Reviewed
                      </span>
                    ) : (
                      <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                  <div>
                    {rating.is_flagged && (
                      <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                        ⚠ Flagged
                      </span>
                    )}
                  </div>
                </div>

                {rating.comment && (
                  <p className="text-gray-700 text-sm mb-3 italic">
                    "{rating.comment}"
                  </p>
                )}

                {rating.is_reviewed_by_admin && rating.admin_response && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                    <p className="text-xs text-blue-900 font-semibold mb-1">
                      Admin Response:
                    </p>
                    <p className="text-sm text-blue-800">{rating.admin_response}</p>
                  </div>
                )}

                <button
                  onClick={() => handleReviewClick(rating)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {rating.is_reviewed_by_admin ? 'Edit Review' : 'Add Review'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Review Rating</h2>
              <button
                onClick={() => setSelectedRating(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Rating Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{selectedRating.customer_name}</strong> rated{' '}
                  <strong>{selectedRating.driver_name}</strong>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < selectedRating.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-bold">{selectedRating.score}/5</span>
                </div>
                {selectedRating.comment && (
                  <p className="text-gray-700 mt-3 italic">"{selectedRating.comment}"</p>
                )}
              </div>

              {/* Admin Response */}
              <div className="space-y-2">
                <label className="block font-semibold">Admin Response</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Write a response to this rating..."
                  rows="4"
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="text-xs text-gray-500 text-right">
                  {adminResponse.length} / 500
                </div>
              </div>

              {/* Flag Section */}
              <div className="space-y-3 border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flagData.is_flagged}
                    onChange={(e) =>
                      setFlagData((prev) => ({ ...prev, is_flagged: e.target.checked }))
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="font-semibold">Flag This Rating</span>
                </label>
                {flagData.is_flagged && (
                  <input
                    type="text"
                    placeholder="Reason for flagging..."
                    value={flagData.flag_reason}
                    onChange={(e) =>
                      setFlagData((prev) => ({ ...prev, flag_reason: e.target.value }))
                    }
                    maxLength={255}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedRating(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRatingsPanel;

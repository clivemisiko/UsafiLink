// frontend/src/pages/admin/Disputes.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import toast from 'react-hot-toast';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const data = await adminAPI.getDisputes();
      setDisputes(data);
    } catch (error) {
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId) => {
    const resolution = prompt('Enter resolution details:');
    if (resolution) {
      try {
        await adminAPI.resolveDispute(disputeId, resolution);
        toast.success('Dispute resolved');
        fetchDisputes();
      } catch (error) {
        toast.error('Failed to resolve dispute');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dispute Management</h1>
        <p className="mt-1 text-sm text-gray-600">Resolve customer disputes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {disputes.map((dispute) => (
          <div key={dispute.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="font-medium">Dispute #{dispute.id}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {dispute.status.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Booking</p>
                <p className="font-medium">#{dispute.booking_details?.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Raised by</p>
                <p className="font-medium">{dispute.raised_by_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="text-gray-800">{dispute.reason}</p>
              </div>
              
              {dispute.resolution && (
                <div>
                  <p className="text-sm text-gray-600">Resolution</p>
                  <p className="text-gray-800">{dispute.resolution}</p>
                </div>
              )}
              
              {dispute.status === 'pending' && (
                <div className="pt-4 border-t">
                  <button
                    onClick={() => handleResolve(dispute.id)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Resolve Dispute
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDisputes;
import { useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
      setUser(null);
    }
  }, []);

  return { user, loading, error };
};

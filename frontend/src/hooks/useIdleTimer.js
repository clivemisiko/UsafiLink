import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const useIdleTimer = (timeoutMs = 15 * 60 * 1000) => { // Default 15 minutes
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        const userRole = localStorage.getItem('user_role');
        const token = localStorage.getItem('access_token');

        if (token && userRole === 'admin') {
            localStorage.clear();
            toast('Session expired due to inactivity', { icon: '🔐' });
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        let timer;

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(handleLogout, timeoutMs);
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer();

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [handleLogout, timeoutMs]);
};

export default useIdleTimer;

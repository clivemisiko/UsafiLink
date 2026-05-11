import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { useDriverTracking } from '../hooks/useDriverTracking';

const UserLayout = () => {
    const { startTracking, stopTracking } = useDriverTracking();

    useEffect(() => {
        // Auto-start tracking if user is a driver
        startTracking();

        return () => stopTracking();
    }, [startTracking, stopTracking]);

    return (
        <div className="min-h-screen bg-parchment text-ink w-full">
            <Navbar />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default UserLayout;

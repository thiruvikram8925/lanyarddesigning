import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useRequireAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();
    
    // Strict route guard: redirects to /login if no valid user session
    const { isLoading, user } = useRequireAuth('/');

    // Automatically slide the dashboard/sidebar left upon entering the lanyard designer
    useEffect(() => {
        if (location.pathname === '/lanyard-designer') {
            const timer = setTimeout(() => {
                setSidebarCollapsed(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [location.pathname]);

    // Block rendering entirely while auth is being validated.
    // This prevents the "Ghost User" / "Guest" UI from ever flashing.
    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-400 font-medium">Verifying session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            <TopBar sidebarCollapsed={sidebarCollapsed} />
            <main
                className="pt-16 min-h-screen transition-all duration-300 ease-in-out"
                style={{ marginLeft: sidebarCollapsed ? 0 : 260 }}
            >
                <div className="p-6">
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    }>
                        <Outlet />
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;

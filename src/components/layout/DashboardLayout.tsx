import { useState, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useRequireAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const isLanyardDesigner = location.pathname.startsWith('/lanyard-designer') || location.pathname === '/dashboard';
    
    // Strict route guard: redirects to /login if no valid user session
    const { isLoading, user } = useRequireAuth('/');

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
            <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="pt-16 min-h-screen">
                <div className={isLanyardDesigner ? "p-2 sm:px-3 sm:pb-3 sm:pt-1" : "p-6"}>
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

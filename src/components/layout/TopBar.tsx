import { Search, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { projectService } from '@/services/dataService';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface TopBarProps {
    sidebarCollapsed: boolean;
}

const TopBar = ({ sidebarCollapsed }: TopBarProps) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [notifications, setNotifications] = useState<Project[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [clearedProjectIds, setClearedProjectIds] = useState<string[]>([]);
    const prevNotifIds = useRef<string[]>([]);

    useEffect(() => {
        if (user?.role === 'super-admin' || user?.role === 'ultra-super-admin') {
            const fetchNotifications = async () => {
                try {
                    const projects = await projectService.getAll();
                    const alerts = projects.filter(p => {
                        if (!p.estimated_delivery) return false;
                        if (clearedProjectIds.includes(p.id || p._id || '')) return false;

                        let completedStagesLocal: string[] = [];
                        try {
                            completedStagesLocal = JSON.parse(p.completed_stages || '[]');
                        } catch (e) {
                            // ignore
                        }
                        if (completedStagesLocal.includes('printing') || completedStagesLocal.includes('completed')) return false;
                        
                        const estDate = new Date(p.estimated_delivery);
                        const today = new Date();
                        estDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        const diffTime = estDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        return diffDays <= 1;
                    });
                    // Sort by overdue first
                    alerts.sort((a, b) => new Date(a.estimated_delivery!).getTime() - new Date(b.estimated_delivery!).getTime());
                    
                    const newNotifIds = alerts.map(a => a.id || a._id || '');
                    const hasNew = newNotifIds.some(id => !prevNotifIds.current.includes(id));
                    
                    if (hasNew && alerts.length > 0) {
                        const count = alerts.length;
                        toast.warning(`Alert: ${count} project${count > 1 ? 's' : ''} due within 1 day or overdue!`, {
                            description: 'Check your notifications for details.',
                        });
                    }
                    prevNotifIds.current = newNotifIds;
                    
                    setNotifications(alerts);
                } catch (error) {
                    console.error('Failed to fetch notifications', error);
                }
            };
            fetchNotifications();
            // Poll every 5 minutes
            const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user, clearedProjectIds]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <header
            className="fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-[60] flex items-center justify-between px-6 transition-all duration-200"
            style={{ left: sidebarCollapsed ? 72 : 260 }}
        >
            {/* Left side empty for spacing */}
            <div className="flex-1"></div>
            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications for Super Admins */}
                {(user?.role === 'super-admin' || user?.role === 'ultra-super-admin') && (
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 max-h-[80vh] overflow-y-auto">
                                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                                            {notifications.length > 0 && (
                                                <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <button 
                                                onClick={() => setClearedProjectIds([...clearedProjectIds, ...notifications.map(n => n.id || n._id || '')])} 
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        {notifications.length === 0 ? (
                                            <p className="text-sm text-gray-500 p-4 text-center">No new notifications</p>
                                        ) : (
                                            notifications.map(p => {
                                                const estDate = new Date(p.estimated_delivery!);
                                                const today = new Date();
                                                estDate.setHours(0, 0, 0, 0);
                                                today.setHours(0, 0, 0, 0);
                                                const diffDays = Math.ceil((estDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                
                                                const isOverdue = diffDays <= 0;
                                                const bgClass = isOverdue ? "bg-red-50 hover:bg-red-100" : "bg-yellow-50 hover:bg-yellow-100";
                                                const textClass = isOverdue ? "text-red-700" : "text-yellow-700";
                                                
                                                return (
                                                    <div key={p.id || p._id} className={`p-4 border-b border-white/50 cursor-pointer transition-colors ${bgClass}`} onClick={() => { navigate('/projects'); setShowNotifications(false); }}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className={`font-bold text-sm ${textClass}`}>{p.name}</h4>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50 ${textClass}`}>
                                                                {isOverdue ? 'OVERDUE' : 'DUE SOON'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mb-2 font-medium">{p.organization}</p>
                                                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                                                            <span>Created: {formatDate(p.created_at)}</span>
                                                            <span className={`font-bold ${textClass}`}>Delivery: {formatDate(p.estimated_delivery)}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('-', ' ') || ''}</p>
                        </div>
                    </button>

                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <UserIcon className="w-4 h-4" />
                                    Profile & Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;

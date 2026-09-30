import { Search, LogOut, Bell, Menu, CreditCard, Box, Columns, Circle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { projectService } from '@/services/dataService';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfiguratorStore, LanyardViewMode } from '@/store/useConfiguratorStore';

const VIEW_TABS = [
    { id: '2d' as const, label: '2D View', icon: CreditCard },
    { id: '3d' as const, label: '3D View', icon: Box },
    { id: 'flat' as const, label: 'Flat Layout', icon: Columns },
    { id: 'clip' as const, label: 'Clip & Hardware', icon: Circle },
    { id: 'validation' as const, label: 'Validation', icon: ShieldCheck, dot: true },
];

interface TopBarProps {
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const TopBar = ({ sidebarOpen, onToggleSidebar }: TopBarProps) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const viewMode = useConfiguratorStore(s => s.viewMode);
    const setViewMode = useConfiguratorStore(s => s.setViewMode);
    const isLanyardDesigner = location.pathname === '/lanyard-designer' || location.pathname.startsWith('/lanyard-designer') || location.pathname === '/dashboard';
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
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-[60] flex items-center justify-between">
            {/* Left side: Hamburger menu (☰) positioned immediately to the left of the GOTEK logo */}
            <div className="flex items-center h-full">
                <button
                    onClick={onToggleSidebar}
                    title={sidebarOpen ? "Close navigation" : "Open navigation"}
                    className="w-14 h-16 border-r border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors focus:outline-none flex items-center justify-center cursor-pointer flex-shrink-0"
                    aria-label="Toggle navigation menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center px-4 sm:px-6 h-full overflow-hidden flex-shrink-0">
                    <img
                        src="/gotek-logo.png"
                        alt="GOTEK Logo"
                        className="h-10 w-auto max-w-[220px] object-contain flex-shrink-0"
                    />
                </div>
            </div>

            {/* Center: Navigation Tabs positioned above main editing workspace */}
            {isLanyardDesigner && (
                <div className="flex items-center justify-center flex-1 mx-2 sm:mx-4 overflow-hidden">
                    <div className="flex items-center bg-slate-100/80 rounded-2xl p-1 overflow-x-auto scrollbar-none border border-slate-200/60 shadow-sm gap-1">
                        {VIEW_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = viewMode === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setViewMode(tab.id)}
                                    className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                                        isActive
                                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{tab.label}</span>
                                    {tab.dot && (
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            isActive ? 'bg-amber-300' : 'bg-amber-500'
                                        }`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-4 px-4 sm:px-6">
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
                            <p className="text-xs text-gray-500 capitalize">{user?.role === 'super-admin' ? 'Admin' : user?.role === 'admin' ? 'User' : (user?.role?.replace('-', ' ') || '')}</p>
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

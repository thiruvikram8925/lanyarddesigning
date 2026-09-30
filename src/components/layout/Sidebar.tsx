import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ribbon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

import { useAuth } from '@/hooks/useAuth';

type NavItem = { label: string; icon: React.ElementType; path: string; allowedRoles: string[] };
type NavGroup = { title: string; items: NavItem[]; isCollapsible?: boolean; id?: string };

const ALL_ROLES = ['ultra-super-admin', 'super-admin', 'admin', 'user'];

const navigation: NavGroup[] = [
    {
        title: 'MAIN',
        items: [
            { label: 'Lanyard Designer', icon: Ribbon, path: '/lanyard-designer', allowedRoles: ALL_ROLES }
        ]
    }
];

const SidebarItem = ({ item, isActive }: { item: NavItem, isActive: boolean }) => (
    <Link
        to={item.path}
        className={cn(
            'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-150 group relative',
            isActive
                ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm ring-1 ring-blue-100/50'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
    >
        <item.icon className={cn(
            'w-5 h-5 flex-shrink-0 transition-all duration-200',
            isActive ? 'text-blue-600 drop-shadow-sm scale-110' : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105'
        )} />
        <span className="text-sm font-medium whitespace-nowrap">
            {item.label}
        </span>
    </Link>
);

const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
    const { user } = useAuth();
    const role = user?.role || 'user';
    const location = useLocation();

    // Filter navigation based on role
    const filteredNavigation = navigation.map(group => ({
        ...group,
        items: group.items.filter(item => item.allowedRoles.includes(role))
    })).filter(group => group.items.length > 0);

    return (
        <motion.aside
            initial={false}
            animate={{ x: collapsed ? -260 : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-200 z-[70] flex flex-col shadow-lg"
        >
            {/* Edge Arrow Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? "Open Dashboard" : "Collapse Dashboard"}
                className="absolute -right-9 top-20 w-9 h-11 bg-white border border-l-0 border-gray-200 rounded-r-xl shadow-md flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer z-50 group"
            >
                {collapsed ? (
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                ) : (
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                )}
            </button>

            {/* Logo */}
            <div className="h-24 flex items-center px-4 border-b border-gray-100/80 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 overflow-hidden w-full">
                    <img src="/gotek-logo.png" alt="GOTEK Logo" className="h-20 w-auto max-w-[220px] object-contain flex-shrink-0" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6 custom-scrollbar">
                {filteredNavigation.map((group) => (
                    <div key={group.title} className="space-y-1">
                        <h3 className="px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            {group.title}
                        </h3>

                        <div className="space-y-1">
                            {group.items.map(item => (
                                <SidebarItem
                                    key={item.path}
                                    item={item}
                                    isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Collapse toggle */}
            <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    className="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 hover:shadow-sm transition-all bg-white border border-transparent"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;

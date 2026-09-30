import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ribbon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

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

const SidebarItem = ({ item, isActive, onClick }: { item: NavItem, isActive: boolean, onClick?: () => void }) => (
    <Link
        to={item.path}
        onClick={onClick}
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

const Sidebar = ({ open, onClose }: SidebarProps) => {
    const { user } = useAuth();
    const role = user?.role || 'user';
    const location = useLocation();

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    // Filter navigation based on role
    const filteredNavigation = navigation.map(group => ({
        ...group,
        items: group.items.filter(item => item.allowedRoles.includes(role))
    })).filter(group => group.items.length > 0);

    return (
        <>
            {/* Backdrop overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 top-16 bg-black/25 backdrop-blur-[2px] z-[65]"
                    />
                )}
            </AnimatePresence>

            {/* Slide-out Sidebar Drawer */}
            <motion.aside
                initial={false}
                animate={{ x: open ? 0 : -300 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[260px] bg-white border-r border-gray-200 z-[70] flex flex-col shadow-2xl"
            >
                {/* Navigation items */}
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
                                        onClick={onClose}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </motion.aside>
        </>
    );
};

export default Sidebar;

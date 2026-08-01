import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Shield, Palette, UserPlus, Trash2, ShieldCheck, Mail, Lock, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService, User as UserType } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const isUltraAdmin = user?.role === 'ultra-super-admin';
    const isAdmin = user?.role === 'super-admin' || isUltraAdmin;
    const isSubAdmin = user?.role === 'admin';
    const canManageAccess = isAdmin || isUltraAdmin;
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        organization: isAdmin ? '' : (user?.organization || 'GOTEK')
    });

    const [enableTrial, setEnableTrial] = useState(false);
    const [trialType, setTrialType] = useState('15_days');
    const [customTrialDate, setCustomTrialDate] = useState('');

    useEffect(() => {
        if (isAdmin) {
            fetchAdmins();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isAdmin]);

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const users = await authService.getUsers();
            // Filter users based on current role's permissions
            let allowedRolesToView = ['ultra-super-admin', 'super-admin', 'admin', 'user'];

            if (user?.role === 'super-admin') {
                allowedRolesToView = ['admin', 'user'];
            } else if (user?.role === 'admin') {
                allowedRolesToView = ['user'];
            }

            const filteredUsers = users.filter((u: UserType) => allowedRolesToView.includes(u.role));
            setAdminUsers(filteredUsers);
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetNewAdminForm = () => {
        setNewAdmin({
            name: '',
            email: '',
            password: '',
            role: 'admin',
            organization: isAdmin ? '' : (user?.organization || 'GOTEK')
        });
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            let trial_end_date = null;
            if (newAdmin.role !== 'user') {
                if (user?.trial_end_date) {
                    trial_end_date = user.trial_end_date;
                } else if (isUltraAdmin && enableTrial) {
                    if (trialType === '15_days') {
                        const date = new Date();
                        date.setDate(date.getDate() + 15);
                        trial_end_date = date.toISOString();
                    } else if (trialType === 'custom' && customTrialDate) {
                        trial_end_date = new Date(customTrialDate).toISOString();
                    }
                }
            }

            await authService.createAdmin({
                name: newAdmin.name,
                email: newAdmin.email,
                password: newAdmin.password,
                role: newAdmin.role,
                organization: newAdmin.organization || user?.organization || 'GOTEK',
                trial_end_date,
                creator_id: user?.id || user?._id
            });
            toast.success('Access created successfully');
            setShowAddDialog(false);
            resetNewAdminForm();
            fetchAdmins();
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create access');
        } finally {
            setIsCreating(false);
        }
    };

    const handleRemoveTrial = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to remove the trial period for ${name}? They will have hassle-free access.`)) return;

        try {
            await authService.updateTrial(id, null);
            toast.success(`Trial removed for ${name}.`);
            fetchAdmins();
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to remove trial');
        }
    };

    const handleExtendTrial = async (id: string, name: string, currentDateStr: string, daysToExtend: number) => {
        if (!window.confirm(`Are you sure you want to add ${daysToExtend} days to the trial period for ${name}?`)) return;

        try {
            const currentEnd = new Date(currentDateStr);
            const now = new Date();
            const baseDate = currentEnd > now ? currentEnd : now;
            baseDate.setDate(baseDate.getDate() + daysToExtend);

            await authService.updateTrial(id, baseDate.toISOString());
            toast.success(`Trial extended by ${daysToExtend} days for ${name}.`);
            fetchAdmins();
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to extend trial');
        }
    };

    const getRemainingTrialDays = (endDateStr: string) => {
        const end = new Date(endDateStr);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to revoke access for ${name}?`)) return;

        try {
            await authService.deleteUser(id);
            toast.success(`Access for ${name} revoked.`);
            fetchAdmins();
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to revoke access');
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;

        if (!name.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setIsUpdatingProfile(true);
        try {
            await authService.updateProfile(user!.id || user!._id, { name });
            updateUser({ name });
            toast.success("Profile updated successfully!");
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get("newPassword") as string;

        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        try {
            await authService.updatePassword(user!.id || user!._id, newPassword);
            toast.success("Password updated successfully!");
            (e.target as HTMLFormElement).reset();
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update password');
        }
    };

    const getRoleLabel = (role: string) => {
        if (role === 'ultra-super-admin') return 'Ultra Super admin';
        if (role === 'super-admin') return 'Super admin';
        return role.replace('-', ' ');
    };


    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account, roles, and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                        </div>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleUpdateProfile}>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                                <Input name="name" defaultValue={user?.name || ''} className="rounded-xl border-gray-200" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                                <Input defaultValue={user?.email || ''} readOnly className="rounded-xl border-gray-200 bg-gray-50 text-gray-500" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Organization</label>
                                <Input defaultValue={user?.organization || ''} readOnly className="rounded-xl border-gray-200 bg-gray-50 text-gray-500" />
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <Button type="submit" disabled={isUpdatingProfile} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 shadow-md shadow-blue-500/10">
                                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-rose-50 rounded-lg">
                                <Lock className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Secure your account with a new password</p>
                            </div>
                        </div>
                        <form className="max-w-md space-y-4" onSubmit={handleUpdatePassword}>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                                <Input name="newPassword" type="password" placeholder="••••••••" className="rounded-xl border-gray-200" required />
                            </div>
                            <Button type="submit" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl px-8">
                                Update Password
                            </Button>
                        </form>
                    </motion.div>
                </div>

                {/* Role info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Account Status</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Access Level</p>
                                <p className="text-sm font-bold text-blue-600 capitalize mt-0.5">{user?.role || 'user'}</p>
                            </div>
                            <ShieldCheck className="w-8 h-8 text-blue-200" />
                        </div>

                        <div className="space-y-3 px-1 mt-2">
                            <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-gray-500">Template Editing</span>
                                {isAdmin || isSubAdmin ? (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none shadow-none">Enabled</Badge>
                                ) : (
                                    <span className="font-bold text-gray-400">Restricted</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-gray-500">Card Generation</span>
                                {isAdmin || isSubAdmin ? (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none shadow-none">Active</Badge>
                                ) : (
                                    <span className="font-bold text-gray-400">Restricted</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-gray-500">User Management</span>
                                <span className="font-bold text-gray-400">
                                    {canManageAccess ? 'Full Access' : 'Restricted'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Super Admin / Admin Section: User Management */}
                {canManageAccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Admin Panel Access</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Manage administrative roles and dashboard access</p>
                                </div>
                            </div>

                            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                <DialogTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 shadow-md shadow-emerald-500/10">
                                        <UserPlus className="w-4 h-4" />
                                        Create New Access
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[450px] rounded-3xl p-8">
                                    <form onSubmit={handleCreateAdmin}>
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold">New Access Request</DialogTitle>
                                            <DialogDescription className="text-sm font-medium pt-1">
                                                Grant system access privileges to a new user.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-6 py-8">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input id="name" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="John Doe" className="pl-11 rounded-xl" required />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input id="email" type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="admin@gotek.com" className="pl-11 rounded-xl" required />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="role" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Select Role</Label>
                                                <Select value={newAdmin.role} onValueChange={val => setNewAdmin({ ...newAdmin, role: val })}>
                                                    <SelectTrigger id="role" className="rounded-xl border-gray-200">
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {isUltraAdmin && <SelectItem value="super-admin">Super Admin</SelectItem>}
                                                        <SelectItem value="admin">Admin (Editor)</SelectItem>
                                                        <SelectItem value="user">Standard User</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Organization</Label>
                                                {isAdmin ? (
                                                    <Input
                                                        value={newAdmin.organization}
                                                        onChange={e => setNewAdmin({ ...newAdmin, organization: e.target.value })}
                                                        placeholder="Organization name"
                                                        className="rounded-xl border-gray-200"
                                                        required
                                                    />
                                                ) : (
                                                    <Input
                                                        value={user?.organization || 'GOTEK'}
                                                        readOnly
                                                        className="rounded-xl border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    />
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="pass" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Temporary Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <Input id="pass" type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="••••••••" className="pl-11 rounded-xl" required />
                                                </div>
                                            </div>

                                            {isUltraAdmin && newAdmin.role !== 'user' && !user?.trial_end_date && (
                                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Enable Trial Period</Label>
                                                        <input
                                                            type="checkbox"
                                                            checked={enableTrial}
                                                            onChange={(e) => setEnableTrial(e.target.checked)}
                                                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                                        />
                                                    </div>

                                                    {enableTrial && (
                                                        <div className="space-y-3 pl-1">
                                                            <Select value={trialType} onValueChange={setTrialType}>
                                                                <SelectTrigger className="rounded-xl border-gray-200">
                                                                    <SelectValue placeholder="Select trial type" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl">
                                                                    <SelectItem value="15_days">15 Days Trial</SelectItem>
                                                                    <SelectItem value="custom">Custom Date</SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            {trialType === 'custom' && (
                                                                <Input
                                                                    type="date"
                                                                    value={customTrialDate}
                                                                    onChange={e => setCustomTrialDate(e.target.value)}
                                                                    className="rounded-xl border-gray-200"
                                                                    required
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" onClick={() => {
                                                setShowAddDialog(false);
                                                resetNewAdminForm();
                                            }} variant="outline" className="rounded-xl flex-1">Cancel</Button>
                                            <Button type="submit" disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 min-w-[140px]">
                                                {isCreating ? 'Creating...' : 'Create Account'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-gray-100">
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12 pl-8">Admin User</TableHead>
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12">Role</TableHead>
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12">Organization</TableHead>
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12">Status</TableHead>
                                        <TableHead className="font-bold text-blue-900/40 text-[11px] uppercase tracking-wider h-12 text-right pr-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching admin data...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : adminUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center">
                                                <p className="text-sm font-medium text-gray-400">No administrative users found.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        adminUsers.map((admin) => (
                                            <TableRow key={admin.id || admin._id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="pl-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{admin.name}</span>
                                                        <span className="text-xs text-gray-500">{admin.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "rounded-md border-none font-bold text-[10px] uppercase px-2 py-0.5",
                                                        admin.role === 'ultra-super-admin' ? "bg-amber-50 text-amber-700" :
                                                            admin.role === 'super-admin' ? "bg-blue-50 text-blue-700" :
                                                                admin.role === 'admin' ? "bg-slate-50 text-slate-700" :
                                                                    "bg-emerald-50 text-emerald-700"
                                                    )}>
                                                        {getRoleLabel(admin.role)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium text-gray-600">{admin.organization}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                        <span className="text-xs font-bold text-emerald-600">Active</span>
                                                    </div>
                                                    {admin.trial_end_date ? (
                                                        <div className="mt-1 flex flex-col gap-1">
                                                            <Badge variant="outline" className="text-[9px] w-fit bg-purple-50 text-purple-700 border-none uppercase">Trial Active</Badge>
                                                            <span className="text-[10px] font-medium text-gray-500">
                                                                {getRemainingTrialDays(admin.trial_end_date) > 0
                                                                    ? `${getRemainingTrialDays(admin.trial_end_date)} days left`
                                                                    : 'Expired'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-1 flex flex-col gap-1">
                                                            <Badge variant="outline" className="text-[9px] w-fit bg-amber-50 text-amber-700 border-none uppercase">Premium</Badge>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isUltraAdmin && admin.trial_end_date ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                    onClick={() => {
                                                                        const daysStr = window.prompt(`How many days do you want to extend the trial for ${admin.name}?`, "14");
                                                                        if (daysStr !== null) {
                                                                            const days = parseInt(daysStr, 10);
                                                                            if (!isNaN(days) && days > 0) {
                                                                                handleExtendTrial(admin.id || admin._id, admin.name, admin.trial_end_date!, days);
                                                                            } else {
                                                                                toast.error("Please enter a valid number of days");
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    Extend Trial
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                                                    onClick={() => handleRemoveTrial(admin.id || admin._id, admin.name)}
                                                                >
                                                                    Remove Trial
                                                                </Button>
                                                            </>
                                                        ) : isUltraAdmin && (
                                                            <div className="h-8"></div>
                                                        )}
                                                        {((isUltraAdmin && admin.role !== 'ultra-super-admin') ||
                                                            (isAdmin && (admin.role === 'admin' || admin.role === 'user'))) ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                onClick={() => handleDeleteUser(admin.id || admin._id, admin.name)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
export default Settings;
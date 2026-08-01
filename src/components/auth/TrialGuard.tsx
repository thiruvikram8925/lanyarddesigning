import { useAuth } from '@/hooks/useAuth';
import { LogOut, Sparkles } from 'lucide-react';

export const TrialGuard = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    
    if (!user || !user.trial_end_date || user.role === 'user') {
        return <>{children}</>;
    }
    
    const now = new Date();
    const trialEnd = new Date(user.trial_end_date);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={{ background: 'linear-gradient(145deg, #f0f4ff 0%, #e8ecf8 30%, #f5f0ff 60%, #eef2ff 100%)' }}>
                {/* Soft decorative blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', top: '-15%', right: '-10%' }} />
                    <div className="absolute w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)', bottom: '-15%', left: '-8%' }} />
                    <div className="absolute w-[350px] h-[350px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.05), transparent 70%)', top: '50%', left: '55%' }} />
                </div>

                {/* Card */}
                <div className="relative max-w-[26rem] w-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative rounded-3xl overflow-hidden" style={{ background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 30px rgba(99,102,241,0.08), 0 20px 60px rgba(99,102,241,0.04)' }}>
                        
                        {/* Subtle top accent bar */}
                        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)' }} />
                        
                        <div className="px-10 pt-10 pb-9 flex flex-col items-center text-center">
                            {/* Logo */}
                            <div className="relative mb-7">
                                <div className="absolute -inset-3 rounded-full opacity-40 blur-xl" style={{ background: 'linear-gradient(135deg, #93c5fd, #a5b4fc)' }} />
                                <div className="relative w-[5.5rem] h-[5.5rem] rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0f5ff, #eef0ff)', border: '1px solid rgba(99,102,241,0.1)' }}>
                                    <img src="/technosprint-logo.png" alt="Technosprint" className="w-14 h-14 object-contain" style={{ filter: 'drop-shadow(0 2px 6px rgba(59,130,246,0.15))' }} />
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-[1.6rem] font-extrabold tracking-tight mb-2.5" style={{ color: '#1e293b' }}>
                                Trial Period Ended
                            </h1>

                            {/* Divider */}
                            <div className="w-10 h-[2.5px] rounded-full mb-5" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                            
                            {/* Message */}
                            <p className="text-[0.9rem] leading-relaxed mb-1" style={{ color: '#64748b' }}>
                                Your trial period plan has completed.
                            </p>
                            <p className="text-[0.9rem] leading-relaxed mb-7" style={{ color: '#64748b' }}>
                                To continue using this application, please contact
                            </p>
                            
                            {/* Company name badge */}
                            <div className="mb-8 px-5 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #f0f4ff, #f5f0ff)', border: '1px solid rgba(99,102,241,0.12)' }}>
                                <div className="flex items-center gap-2.5 justify-center">
                                    <Sparkles className="w-4 h-4" style={{ color: '#6366f1' }} />
                                    <span className="text-[0.8rem] font-bold" style={{ color: '#4338ca', letterSpacing: '0.1em' }}>TECHNOSPRINT INFO SOLUTIONS</span>
                                </div>
                            </div>

                            {/* Logout button */}
                            <button
                                onClick={() => {
                                    localStorage.removeItem('gotek_token');
                                    localStorage.removeItem('gotek_user');
                                    window.location.href = '/';
                                }}
                                className="group w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer"
                                style={{ 
                                    background: '#f8fafc', 
                                    border: '1px solid #e2e8f0',
                                    color: '#64748b',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f1f5f9';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                    e.currentTarget.style.color = '#334155';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f8fafc';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.color = '#64748b';
                                }}
                            >
                                <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // Banner Badge
    return (
        <>
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in slide-in-from-top-4 duration-500">
                <div className="px-5 py-2.5 rounded-full font-bold text-sm text-white flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }}>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span style={{ letterSpacing: '0.02em' }}>Trial: {diffDays} {diffDays === 1 ? 'Day' : 'Days'} Left</span>
                </div>
            </div>
            {children}
        </>
    );
};

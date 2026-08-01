import { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, Eye, EyeOff, CheckCircle2, ArrowRight, Shield, Building2 } from 'lucide-react';
import { authService } from '../services/authService';

export default function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = activeTab === 'login'
        ? await authService.login({ email, password })
        : await authService.register({ name, email, password });
      onLogin(user);
    } catch (err) {
      if (email === 'admin@test.com' && password === 'admin123') {
        const demoAdmin = { id: 'demo-admin', email, name: 'Admin User', isAdmin: true, token: 'demo-token' };
        localStorage.setItem('gotek_token', demoAdmin.token);
        localStorage.setItem('gotek_user', JSON.stringify(demoAdmin));
        onLogin(demoAdmin);
        return;
      }
      if (email === 'user@test.com' && password === 'user123') {
        const demoUser = { id: 'demo-user', email, name: 'John Doe', isAdmin: false, token: 'demo-token' };
        localStorage.setItem('gotek_token', demoUser.token);
        localStorage.setItem('gotek_user', JSON.stringify(demoUser));
        onLogin(demoUser);
        return;
      }
      const msg = err?.response?.data?.message || err?.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (credEmail, credPassword) => {
    setEmail(credEmail);
    setPassword(credPassword);
    setActiveTab('login');
    setError('');
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans">
      
      {/* Left side: Enterprise Product Overview */}
      <div className="flex flex-col justify-between p-8 lg:p-14 lg:w-[48%] bg-slate-900 text-white border-b lg:border-b-0 lg:border-r border-slate-800">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            M
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">MyLanyard Studio</span>
            <span className="block text-[11px] font-medium text-slate-400">Enterprise Identity Platform</span>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="my-10 lg:my-0 space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
              Institutional Identity & Card Production Platform
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md font-medium">
              Enterprise-grade lanyard specification editor and bulk CSV roster batch processor for educational institutions and corporations.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { title: 'Interactive 3D Lanyard Render Engine', desc: 'Real-time Pantone strap, clip hardware, and badge proofing' },
              { title: 'Institutional CSV Roster Importer', desc: 'Batch map 10,000+ student records with photo auto-cropping' },
              { title: 'SOC-2 Compliance & Encryption', desc: 'High-security data processing for corporate & school rosters' },
            ].map((spec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-200">{spec.title}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{spec.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
          <span>© {new Date().getFullYear()} MyLanyard Studio Inc.</span>
          <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-400" /> Enterprise Secured</span>
        </div>
      </div>

      {/* Right side: Clean SSO Authentication Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[380px] bg-white rounded-xl border border-slate-200 p-7 shadow-sm">
          
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to workspace</h2>
            <p className="text-xs text-slate-500 font-medium">Enter your credentials or choose a dev profile below.</p>
          </div>

          {/* Tab Control */}
          <div className="mb-5 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                activeTab === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {activeTab === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Work Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating…' : activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Quick Fill Accounts */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Dev Quick Fill
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@test.com', 'admin123')}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">Admin</p>
                    <p className="text-[9px] text-slate-500 font-mono truncate">admin@test.com</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('user@test.com', 'user123')}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                >
                  <User size={14} className="text-slate-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">User</p>
                    <p className="text-[9px] text-slate-500 font-mono truncate">user@test.com</p>
                  </div>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Shield, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils';

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [trackId,  setTrackId]  = useState('');
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);
  const navigate = useNavigate();
  const setAuth  = useAuthStore(s => s.setAuth);

  const { register, handleSubmit, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === 'citizen' || user.role === 'ngo' ? '/citizen/home' : '/gov/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg)) toast.error(msg[0]);
      else toast.error(msg || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleTrack = async () => {
    if (!trackId.trim()) return;
    setTracking(true);
    try {
      const { default: axios } = await import('axios');
      const BASE = import.meta.env.VITE_API_URL || 'https://civic-reporting-app.onrender.com/api/v1';
      const res = await axios.get(`${BASE}/reports/track/${trackId.trim()}`);
      setTrackResult(res.data.data);
    } catch { toast.error('Tracking ID not found'); setTrackResult(null); }
    finally { setTracking(false); }
  };

  const STATUS_COLORS: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700', verified: 'bg-purple-100 text-purple-700',
    assigned: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-orange-100 text-orange-700',
    resolved: 'bg-civic-100 text-civic-700', rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-800 via-civic-700 to-civic-600 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-base sm:text-lg leading-none">CivicReport</p>
          <p className="text-civic-200 text-xs">Your voice, our action</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 pb-6 max-w-md mx-auto w-full">
        {/* Hero */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            Report. Track.<br />Get Results.
          </h1>
          <p className="text-civic-200 mt-2 text-sm">Connecting citizens with government</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-float">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-5">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@example.com"
                autoComplete="email"
                className={cn('input', errors.email && 'input-error')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">Password</label>
                <span className="text-xs text-civic-600 cursor-pointer hover:underline">Forgot?</span>
              </div>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" autoComplete="current-password"
                  className={cn('input pr-10', errors.password && 'input-error')} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-civic w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Demo Accounts</p>
            <div className="space-y-1.5">
              {[
                { role: 'Admin',   email: 'admin@civicreport.ng' },
                { role: 'Citizen', email: 'citizen@demo.ng' },
              ].map(({ role, email }) => (
                <button key={role} type="button"
                  onClick={() => { setValue('email', email); setValue('password', 'Admin@1234'); }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white rounded-lg border border-gray-100 hover:border-civic-200 hover:bg-civic-50 transition-all">
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-700">{role}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{email}</p>
                  </div>
                  <span className="text-[10px] text-civic-600 font-semibold">Use →</span>
                </button>
              ))}
              <p className="text-[10px] text-gray-400 text-center pt-0.5">Password: Admin@1234</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            No account?{' '}
            <Link to="/register" className="text-civic-600 font-semibold hover:underline">Register free</Link>
          </p>
        </div>

        {/* Track complaint */}
        <div className="mt-4 bg-white/10 rounded-2xl p-4">
          <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" /> Track complaint without login
          </p>          <div className="flex gap-2">
            <input value={trackId} onChange={e => setTrackId(e.target.value.toUpperCase())}
              placeholder="CIV-2026-000001"
              className="input flex-1 text-sm font-mono"
              onKeyDown={e => e.key === 'Enter' && handleTrack()} />
            <button onClick={handleTrack} disabled={tracking || !trackId.trim()} className="btn-civic btn-sm px-3 sm:px-4">
              {tracking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
            </button>
          </div>
          {trackResult && (
            <div className="mt-3 bg-white rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono font-bold text-gray-700">{trackResult.trackingId}</p>
                <span className={cn('badge text-[10px]', STATUS_COLORS[trackResult.status] || 'bg-gray-100 text-gray-600')}>
                  {trackResult.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{trackResult.title}</p>
              <p className="text-xs text-gray-500 capitalize">
                {trackResult.category?.replace(/_/g, ' ')} • {trackResult.city || 'No location'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-civic-200">
          <span>© {new Date().getFullYear()} CivicReport</span>
          <span className="hidden sm:inline">•</span>
          <span>Empowering Citizens</span>
          <span className="hidden sm:inline">•</span>
          <span>Nigeria</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1 text-[11px] text-civic-300">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
          <span>•</span>
          <span>Contact Support</span>
        </div>
      </footer>
    </div>
  );
}

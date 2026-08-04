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
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin' || user.role === 'government_officer') {
        navigate('/gov/dashboard');
      } else {
        navigate('/citizen/home');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg)) toast.error(msg[0]);
      else if (msg) toast.error(msg);
      else toast.error('Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!trackingId.trim()) return;
    setTracking(true);
    try {
      const { default: axios } = await import('axios');
      const res = await axios.get(`/api/v1/reports/track/${trackingId.trim()}`);
      setTrackResult(res.data.data);
    } catch {
      toast.error('Tracking ID not found');
      setTrackResult(null);
    } finally { setTracking(false); }
  };

  const STATUS_COLORS: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    verified: 'bg-purple-100 text-purple-700',
    assigned: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-orange-100 text-orange-700',
    resolved: 'bg-civic-100 text-civic-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-800 via-civic-700 to-civic-600 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-lg leading-none">CivicReport</p>
          <p className="text-civic-200 text-xs">Your voice, our action</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Hero text */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white leading-tight">
            Report. Track.<br />Get Results.
          </h1>
          <p className="text-civic-200 mt-2 text-sm">
            Connect citizens with government for faster issue resolution
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl p-6 shadow-float">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com"
                autoComplete="email"
                className={cn('input', errors.email && 'input-error')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">Password</label>
                <Link to="/forgot-password" className="text-xs text-civic-600 hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" autoComplete="current-password"
                  className={cn('input pr-10', errors.password && 'input-error')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-civic w-full py-3 text-base font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Test Accounts</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-600">Admin (pre-created)</p>
                  <p className="text-[11px] text-gray-400 font-mono">admin@civicreport.ng / Admin@1234</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    (document.querySelector('input[type="email"]') as HTMLInputElement).value = 'admin@civicreport.ng';
                    (document.querySelector('input[type="password"]') as HTMLInputElement).value = 'Admin@1234';
                  }}
                  className="text-[10px] text-civic-600 font-semibold border border-civic-200 px-2 py-1 rounded-lg hover:bg-civic-50"
                >
                  Use
                </button>
              </div>
              <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">
                💡 Citizens must <span className="font-semibold text-civic-600">register first</span> — click "Register free" below
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            No account?{' '}
            <Link to="/register" className="text-civic-600 font-semibold hover:underline">Register free</Link>
          </p>
        </div>

        {/* Track complaint without login */}
        <div className="mt-5 bg-white/10 rounded-2xl p-4">
          <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" /> Track a complaint without signing in
          </p>
          <div className="flex gap-2">
            <input value={trackingId} onChange={e => setTrackingId(e.target.value.toUpperCase())}
              placeholder="e.g. CIV-2024-000123"
              className="input flex-1 text-sm font-mono"
              onKeyDown={e => e.key === 'Enter' && handleTrack()} />
            <button onClick={handleTrack} disabled={tracking || !trackingId.trim()}
              className="btn-civic btn-sm px-4">
              {tracking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
            </button>
          </div>
          {trackResult && (
            <div className="mt-3 bg-white rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono font-bold text-gray-700">{trackResult.trackingId}</p>
                <span className={cn('badge text-[10px]', STATUS_COLORS[trackResult.status] || 'bg-gray-100 text-gray-600')}>
                  {trackResult.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{trackResult.title}</p>
              <p className="text-xs text-gray-500 capitalize">{trackResult.category?.replace('_', ' ')} • {trackResult.city || 'No location'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

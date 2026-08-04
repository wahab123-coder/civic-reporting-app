import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Shield, User, Users, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils';

const schema = z.object({
  name:     z.string().min(2, 'Full name required'),
  email:    z.string().email('Enter a valid email'),
  phone:    z.string().optional(),
  password: z.string().min(8, 'Min 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
      message: 'Must include uppercase, lowercase, number and special character',
    }),
  role: z.enum(['citizen', 'government_officer']).default('citizen'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [avatar, setAvatar]       = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);
  const navigate                  = useNavigate();
  const setAuth                   = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'citizen' } });

  const role = watch('role');

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5 MB'); return; }
    setAvatar(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1 — Register
      const res = await authApi.register(data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);

      // 2 — Upload avatar if selected
      if (avatar) {
        try {
          const form = new FormData();
          form.append('avatar', avatar);
          const { default: axios } = await import('axios');
          const up = await axios.post(
            `http://localhost:3000/api/v1/users/${user.id}/avatar`,
            form,
            { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' } },
          );
          useAuthStore.getState().setUser({ ...user, avatar: up.data.data.avatar });
        } catch {
          // avatar upload optional — don't block login
        }
      }

      toast.success(`Welcome, ${user.name}! 🎉`);
      navigate(user.role === 'citizen' ? '/citizen/home' : '/gov/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg)) toast.error(msg[0]);
      else if (msg) toast.error(msg);
      else toast.error('Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-800 via-civic-700 to-civic-600 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <p className="font-bold text-white text-lg">CivicReport</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-civic-200 mt-1 text-sm">Join thousands improving their communities</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-float">

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { val: 'citizen',            label: 'Citizen',           icon: User,  desc: 'Report issues' },
              { val: 'government_officer', label: 'Gov. Officer',      icon: Users, desc: 'Manage reports' },
            ].map(({ val, label, icon: Icon, desc }) => (
              <button key={val} type="button"
                onClick={() => setValue('role', val as any)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                  role === val ? 'border-civic-500 bg-civic-50' : 'border-gray-200 hover:border-civic-200',
                )}>
                <Icon className={cn('w-5 h-5', role === val ? 'text-civic-600' : 'text-gray-400')} />
                <p className={cn('text-xs font-semibold', role === val ? 'text-civic-700' : 'text-gray-600')}>
                  {label}
                </p>
                <p className="text-[10px] text-gray-400">{desc}</p>
              </button>
            ))}
          </div>

          {/* Profile photo picker */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer hover:border-civic-400 hover:bg-civic-50 transition-all overflow-hidden"
              >
                {preview
                  ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                  : <Camera className="w-7 h-7 text-gray-300" />
                }
              </div>
              {preview && (
                <button
                  type="button"
                  onClick={() => { setAvatar(null); setPreview(null); }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            <p className="text-[11px] text-gray-400 mt-1.5">
              {preview ? 'Tap photo to change' : 'Add profile photo (optional)'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name *</label>
              <input {...register('name')} placeholder="John Doe"
                className={cn('input', errors.name && 'input-error')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email Address *</label>
              <input {...register('email')} type="email" placeholder="you@example.com"
                className={cn('input', errors.email && 'input-error')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone (optional)</label>
              <input {...register('phone')} placeholder="+234 800 000 0000" className="input" />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Password *</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 chars, A-z, 0-9, @$!"
                  className={cn('input pr-10', errors.password && 'input-error')} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-civic w-full py-3 text-base font-semibold mt-1">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account…</>
                : '🚀 Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-civic-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

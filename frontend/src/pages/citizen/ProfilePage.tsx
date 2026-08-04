import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Camera, LogOut, ChevronRight, Bell, Shield, Globe, Phone, X, Loader2, Edit2, FileText, CheckCircle2, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersApi, authApi, reportsApi } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cn, formatDate } from '@/utils';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [editing, setEditing]       = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile]   = useState(false);
  const [name, setName]             = useState(user?.name || '');
  const [phone, setPhone]           = useState(user?.phone || '');
  const [language, setLanguage]     = useState(user?.language || 'en');
  const [preview, setPreview]       = useState<string | null>(user?.avatar || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: statsData } = useQuery({
    queryKey: ['my-report-stats'],
    queryFn: async () => {
      const res = await reportsApi.getAll({ page: 1, limit: 100 });
      const reports = res.data.data?.data || [];
      return {
        total:    reports.length,
        resolved: reports.filter((r: any) => r.status === 'resolved').length,
        pending:  reports.filter((r: any) => !['resolved','rejected'].includes(r.status)).length,
        rejected: reports.filter((r: any) => r.status === 'rejected').length,
      };
    },
  });

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      setPreview(src);
      setUploadingPhoto(true);
      try {
        const form = new FormData();
        form.append('avatar', file);
        const { default: axios } = await import('axios');
        const res = await axios.post(
          `http://localhost:3000/api/v1/users/${user?.id}/avatar`,
          form,
          { headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}`, 'Content-Type': 'multipart/form-data' } },
        );
        setUser({ ...user!, avatar: res.data.data.avatar });
        toast.success('Profile photo updated!');
      } catch { toast.error('Photo upload failed'); setPreview(user?.avatar || null); }
      finally { setUploadingPhoto(false); }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await usersApi.update(user!.id, { name, phone, language });
      setUser(res.data.data);
      toast.success('Profile updated');
      setEditing(false);
    } catch { toast.error('Update failed'); }
    finally { setSavingProfile(false); }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout(); navigate('/login'); toast.success('Logged out');
  };

  const MENU = [
    { icon: Bell,   label: 'Notifications',     to: '/citizen/notifications' },
    { icon: Phone,  label: 'Emergency Contacts', to: '/citizen/emergency' },
    { icon: Globe,  label: 'Announcements',      to: '/citizen/announcements' },
    { icon: Shield, label: 'Privacy & Security', to: '/citizen/profile' },
  ];

  const LANGS = [{ val: 'en', label: 'English' }, { val: 'yo', label: 'Yoruba' }, { val: 'ha', label: 'Hausa' }, { val: 'ig', label: 'Igbo' }];

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      {/* Profile hero */}
      <div className="bg-gradient-to-r from-civic-700 to-civic-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full border-3 border-white/40 overflow-hidden bg-white/20 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
            >
              {preview
                ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
              }
            </div>
            <div className={cn(
              'absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white',
              uploadingPhoto ? 'bg-yellow-400' : 'bg-civic-500',
            )}>
              {uploadingPhoto ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg leading-tight truncate">{user?.name}</h2>
            <p className="text-civic-200 text-xs mt-0.5 truncate">{user?.email || user?.phone}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wide">
                {user?.role?.replace('_', ' ')}
              </span>
              {user?.isEmailVerified && (
                <span className="px-2 py-0.5 bg-civic-400/40 rounded-full text-[10px] font-semibold">✓ Verified</span>
              )}
            </div>
          </div>

          <button onClick={() => setEditing(!editing)} className="flex-shrink-0 p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
            <Edit2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Total',    value: statsData?.total    || 0, icon: '📋' },
            { label: 'Resolved', value: statsData?.resolved || 0, icon: '✅' },
            { label: 'Pending',  value: statsData?.pending  || 0, icon: '⏳' },
            { label: 'Rejected', value: statsData?.rejected || 0, icon: '❌' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-2 text-center">
              <p className="text-sm">{s.icon}</p>
              <p className="text-base font-bold">{s.value}</p>
              <p className="text-[9px] text-civic-200 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card space-y-4 border-2 border-civic-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-civic-600" /> Edit Profile
          </h3>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+234..." />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Preferred Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="input">
              {LANGS.map(l => <option key={l.val} value={l.val}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={saveProfile} disabled={savingProfile} className="btn-civic flex-1">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Info card */}
      {!editing && (
        <div className="card divide-y divide-gray-50">
          <h3 className="font-bold text-gray-900 pb-3">Account Information</h3>
          {[
            { label: 'Full Name',  value: user?.name },
            { label: 'Email',      value: user?.email || '—' },
            { label: 'Phone',      value: user?.phone || '—' },
            { label: 'Language',   value: LANGS.find(l => l.val === user?.language)?.label || 'English' },
            { label: 'Member Since', value: user?.createdAt ? formatDate(user.createdAt) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2.5">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[60%] text-right">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick links menu */}
      <div className="card p-0 overflow-hidden">
        {MENU.map(({ icon: Icon, label, to }, i) => (
          <button key={label} onClick={() => navigate(to)}
            className={cn('flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-50 transition-colors text-left',
              i < MENU.length - 1 && 'border-b border-gray-50')}>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-500" />
            </div>
            <p className="flex-1 text-sm font-medium text-gray-800">{label}</p>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-gray-300">CivicReport v1.0.0</p>

      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}

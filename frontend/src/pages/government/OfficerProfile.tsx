import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, LogOut, Loader2, Edit2, Shield,
  Building2, CheckCircle2, Clock, FileText, Star,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersApi, authApi } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { formatDate, cn } from '@/utils';
import toast from 'react-hot-toast';

export default function OfficerProfile() {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [editing, setEditing]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [name, setName]                 = useState(user?.name || '');
  const [phone, setPhone]               = useState(user?.phone || '');
  const [preview, setPreview]           = useState<string | null>(user?.avatar || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: myStats } = useQuery({
    queryKey: ['officer-stats', user?.id],
    queryFn: async () => {
      const { default: axios } = await import('axios');
      const token = useAuthStore.getState().accessToken;
      const res = await axios.get('/api/v1/reports', {
        params: { page: 1, limit: 100 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const reports = res.data.data?.data || [];
      return {
        total:       reports.length,
        resolved:    reports.filter((r: any) => r.status === 'resolved').length,
        inProgress:  reports.filter((r: any) => r.status === 'in_progress').length,
        pending:     reports.filter((r: any) => ['submitted','verified','assigned'].includes(r.status)).length,
      };
    },
  });

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      setPreview(src);
      setUploading(true);
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
        toast.success('Photo updated!');
      } catch { toast.error('Upload failed'); setPreview(user?.avatar || null); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await usersApi.update(user!.id, { name, phone });
      setUser(res.data.data);
      toast.success('Profile updated');
      setEditing(false);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout(); navigate('/login'); toast.success('Logged out');
  };

  const resolutionRate = myStats?.total
    ? Math.round((myStats.resolved / myStats.total) * 100)
    : 0;

  return (
    <div className="space-y-5 pb-8 animate-fade-in">

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-gov-800 to-gov-700 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-white/40 overflow-hidden bg-white/20 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
            >
              {preview
                ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold">{user?.name?.charAt(0)?.toUpperCase()}</span>
              }
            </div>
            <div className={cn('absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center',
              uploading ? 'bg-yellow-400' : 'bg-gov-500')}>
              {uploading
                ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                : <Camera className="w-3 h-3 text-white" />}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-xl leading-tight">{user?.name}</p>
            <p className="text-gov-300 text-sm mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wide">
                {user?.role === 'admin' ? '👑 Administrator' : '🏛️ Government Officer'}
              </span>
              <span className="px-2.5 py-0.5 bg-civic-500/40 rounded-full text-[10px] font-semibold">
                {resolutionRate}% resolution rate
              </span>
            </div>
          </div>

          <button onClick={() => setEditing(!editing)}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all flex-shrink-0">
            <Edit2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Performance stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Total',      value: myStats?.total      || 0, icon: '📋' },
            { label: 'Resolved',   value: myStats?.resolved   || 0, icon: '✅' },
            { label: 'In Progress',value: myStats?.inProgress || 0, icon: '🔧' },
            { label: 'Pending',    value: myStats?.pending    || 0, icon: '⏳' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-2 text-center">
              <p className="text-sm">{s.icon}</p>
              <p className="text-base font-bold">{s.value}</p>
              <p className="text-[9px] text-gov-300 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance bar */}
      {(myStats?.total || 0) > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Performance Score
            </p>
            <p className={cn('text-sm font-bold',
              resolutionRate >= 70 ? 'text-civic-600' : resolutionRate >= 40 ? 'text-orange-500' : 'text-red-500')}>
              {resolutionRate}%
            </p>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700',
                resolutionRate >= 70 ? 'bg-civic-500' : resolutionRate >= 40 ? 'bg-orange-400' : 'bg-red-400')}
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {myStats?.resolved} resolved out of {myStats?.total} total assigned
          </p>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="card space-y-4 border-2 border-gov-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-gov-600" /> Edit Profile
          </h3>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+234..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={saveProfile} disabled={saving} className="btn-gov flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Account info */}
      {!editing && (
        <div className="card divide-y divide-gray-50">
          <h3 className="font-bold text-gray-900 pb-3">Account Information</h3>
          {[
            { label: 'Full Name',    value: user?.name },
            { label: 'Email',        value: user?.email     || '—' },
            { label: 'Phone',        value: user?.phone     || '—' },
            { label: 'Role',         value: user?.role?.replace(/_/g, ' ') },
            { label: 'Status',       value: user?.isActive ? '✅ Active' : '❌ Inactive' },
            { label: 'Member Since', value: user?.createdAt ? formatDate(user.createdAt) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2.5">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-sm font-semibold text-gray-800 capitalize truncate max-w-[55%] text-right">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/gov/dashboard')}
          className="card flex flex-col items-center gap-2 py-4 hover:shadow-card-hover transition-all">
          <div className="w-10 h-10 bg-gov-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-gov-600" />
          </div>
          <p className="text-xs font-semibold text-gray-700">My Complaints</p>
        </button>
        <button onClick={() => navigate('/gov/notifications')}
          className="card flex flex-col items-center gap-2 py-4 hover:shadow-card-hover transition-all">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-xs font-semibold text-gray-700">Notifications</p>
        </button>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useOverview, useByCategory,
  useReportsByMonth, useDepartmentPerformance,
} from '@/hooks/useAnalytics';
import { usersApi, commentsApi, authApi } from '@/services/api';
import {
  FileText, Users, Clock, Building2, TrendingUp,
  Shield, BarChart3, Activity, Search, Eye,
  UserCircle, LogOut, Loader2, Send, X, Copy,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, STATUS_LABELS,
  formatDate, formatDateTime, timeAgo, cn,
} from '@/utils';
import { ReportCategory, ReportStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const PIE_COLORS: Record<string, string> = {
  submitted: '#3b82f6', verified: '#8b5cf6', assigned: '#f59e0b',
  in_progress: '#f97316', resolved: '#16a34a', rejected: '#dc2626',
};

function AdminProfile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { default: axios } = await import('axios');
      const token = useAuthStore.getState().accessToken;
      const res = await axios.patch(`/api/v1/users/${user?.id}`, { name },
        { headers: { Authorization: `Bearer ${token}` } });
      useAuthStore.getState().setUser(res.data.data);
      toast.success('Profile updated');
      setEditing(false);
    } catch { toast.error('Update failed'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-gov-700 to-gov-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-2 border-white/30">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-xl">{user?.name}</p>
            <p className="text-gov-200 text-sm mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase">
              {user?.role === 'admin' ? '👑 System Admin' : '🏛️ Gov Officer'}
            </span>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Profile Information</h3>
          <button onClick={() => setEditing(!editing)} className="text-xs text-gov-600 font-semibold hover:underline">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" />
            </div>
            <button onClick={save} disabled={saving} className="btn-gov w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Full Name',      value: user?.name },
              { label: 'Email',          value: user?.email },
              { label: 'Role',           value: user?.role?.replace(/_/g, ' ') },
              { label: 'Status',         value: user?.isActive ? '✅ Active' : '❌ Inactive' },
              { label: 'Email Verified', value: user?.isEmailVerified ? '✅ Yes' : '⚠️ No' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2.5">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-800 capitalize">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={async () => {
        try { await authApi.logout(); } catch {}
        logout(); navigate('/login'); toast.success('Logged out');
      }} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}

function ComplaintModal({ report, onClose, onRefresh }: { report: any; onClose: () => void; onRefresh: () => void }) {
  const [comment, setComment] = useState('');
  const qc = useQueryClient();

  const { data: commentsData } = useQuery({
    queryKey: ['modal-comments', report.id],
    queryFn: async () => (await commentsApi.getByReport(report.id)).data.data,
  });

  const addComment = useMutation({
    mutationFn: () => commentsApi.create({ content: comment, reportId: report.id }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['modal-comments', report.id] });
      toast.success('Response sent to citizen');
    },
  });

  const changeStatus = async (status: string) => {
    try {
      const { default: axios } = await import('axios');
      const token = useAuthStore.getState().accessToken;
      await axios.patch(`/api/v1/reports/${report.id}/status`,
        { status, note: `Updated by admin to ${status}` },
        { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Status → "${STATUS_LABELS[status as ReportStatus]}"`);
      qc.invalidateQueries({ queryKey: ['admin-complaints'] });
      onRefresh(); onClose();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-float max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{CATEGORY_ICONS[report.category]}</span>
              <h3 className="font-bold text-gray-900">{report.title}</h3>
              <StatusBadge status={report.status} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-mono text-gray-400">{report.trackingId}</p>
              <button onClick={() => { navigator.clipboard.writeText(report.trackingId); toast.success('Copied!'); }}>
                <Copy className="w-3 h-3 text-gray-400 hover:text-gov-600" />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl ml-2 flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Complaint Info</p>
              <div><p className="text-[10px] text-gray-400">Category</p><p className="text-sm font-semibold">{CATEGORY_LABELS[report.category as ReportCategory]}</p></div>
              <div><p className="text-[10px] text-gray-400">Priority</p><p className="text-sm font-semibold capitalize">{report.priority}</p></div>
              <div><p className="text-[10px] text-gray-400">Location</p><p className="text-xs text-gray-700">{[report.address, report.city, report.state].filter(Boolean).join(', ') || 'Not provided'}</p></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Citizen Info</p>
              <div><p className="text-[10px] text-gray-400">Reported by</p><p className="text-sm font-semibold">{report.isAnonymous ? 'Anonymous' : report.user?.name || 'Unknown'}</p></div>
              <div><p className="text-[10px] text-gray-400">Submitted</p><p className="text-xs">{formatDateTime(report.createdAt)}</p></div>
              <div><p className="text-[10px] text-gray-400">Upvotes</p><p className="text-sm font-semibold">👍 {report.upvotes}</p></div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{report.description}</p>
          </div>
          {report.status === 'resolved' && (
            <div className={cn('p-3 rounded-xl border text-sm',
              report.citizenConfirmed === true  ? 'bg-civic-50 border-civic-200 text-civic-700' :
              report.citizenConfirmed === false ? 'bg-red-50 border-red-200 text-red-700' :
                                                  'bg-yellow-50 border-yellow-200 text-yellow-700')}>
              <p className="font-semibold text-xs">Citizen Confirmation:</p>
              <p className="text-xs mt-0.5">
                {report.citizenConfirmed === true  ? '✅ Confirmed resolved' :
                 report.citizenConfirmed === false ? '⚠️ Citizen says NOT resolved' :
                                                    '⏳ Awaiting citizen confirmation'}
              </p>
              {report.citizenFeedback && <p className="text-xs mt-1 italic">"{report.citizenFeedback}"</p>}
            </div>
          )}
          {!['resolved','rejected'].includes(report.status) && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {report.status === 'submitted'                        && <button onClick={() => changeStatus('verified')}    className="btn-outline btn-sm text-purple-700 border-purple-200">✅ Verify</button>}
                {['submitted','verified'].includes(report.status)     && <button onClick={() => changeStatus('assigned')}    className="btn-gov btn-sm">📋 Assign</button>}
                {['verified','assigned'].includes(report.status)      && <button onClick={() => changeStatus('in_progress')} className="btn-outline btn-sm text-orange-700 border-orange-200">🔧 In Progress</button>}
                {report.status === 'in_progress'                      && <button onClick={() => changeStatus('resolved')}    className="btn-civic btn-sm">🎉 Resolved</button>}
                <button onClick={() => changeStatus('rejected')} className="btn-danger btn-sm">❌ Reject</button>
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">
              Government Responses &amp; Steps Taken ({commentsData?.length || 0})
            </p>
            <div className="space-y-3 max-h-52 overflow-y-auto mb-3">
              {!commentsData?.length
                ? <p className="text-sm text-gray-400 text-center py-4">No responses yet</p>
                : commentsData.map((c: any) => {
                    const isGov = ['government_officer','admin'].includes(c.user?.role);
                    return (
                      <div key={c.id} className={cn('flex gap-2.5', isGov ? 'flex-row-reverse' : '')}>
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                          isGov ? 'bg-gov-600 text-white' : 'bg-gray-200 text-gray-600')}>
                          {isGov ? '🏛' : c.user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 max-w-[80%]">
                          <div className={cn('rounded-2xl px-3 py-2.5 text-sm',
                            isGov ? 'bg-gov-600 text-white' : 'bg-gray-100 text-gray-800')}>
                            <p className={cn('text-[10px] font-bold mb-0.5', isGov ? 'text-gov-200' : 'text-gray-400')}>
                              {isGov ? `🏛️ ${c.user?.name} · ${c.user?.role?.replace('_',' ')}` : `👤 ${c.user?.name} · Citizen`}
                            </p>
                            {c.content}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 px-1">{timeAgo(c.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
            </div>
            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <input value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && comment.trim() && addComment.mutate()}
                placeholder="Send official government response..." className="input flex-1 text-sm" />
              <button onClick={() => addComment.mutate()} disabled={!comment.trim() || addComment.isPending} className="btn-gov px-3">
                {addComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab]               = useState<'overview'|'complaints'|'users'|'analytics'|'profile'>('overview');
  const [statusFilter, setStatus]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<any>(null);
  const qc                          = useQueryClient();

  const { data: overview }  = useOverview();
  const { data: categories} = useByCategory();
  const { data: monthly }   = useReportsByMonth();
  const { data: deptPerf }  = useDepartmentPerformance();

  const { data: rData, isLoading: loadingR, refetch } = useQuery({
    queryKey: ['admin-complaints', statusFilter, search, page],
    queryFn: async () => {
      const { default: axios } = await import('axios');
      const token = useAuthStore.getState().accessToken;
      const res = await axios.get('/api/v1/reports', {
        params: { status: statusFilter || undefined, search: search || undefined, page, limit: 15 },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
    enabled: tab === 'complaints',
  });

  const { data: uData, isLoading: loadingU } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => (await usersApi.getAll({ page, limit: 15 })).data.data,
    enabled: tab === 'users',
  });

  const reports = rData?.data || [];
  const users   = uData?.data || [];
  const pieData = overview?.byStatus?.map((s: any) => ({
    name: STATUS_LABELS[s.status as ReportStatus] || s.status,
    value: s.count,
    fill: PIE_COLORS[s.status] || '#94a3b8',
  })) || [];

  const TABS = [
    { key: 'overview',   label: 'Overview',  icon: BarChart3  },
    { key: 'complaints', label: 'Complaints', icon: FileText   },
    { key: 'users',      label: 'Users',      icon: Users      },
    { key: 'analytics',  label: 'Analytics',  icon: TrendingUp },
    { key: 'profile',    label: 'My Profile', icon: UserCircle },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-gov-800 to-gov-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Government Admin Dashboard</h2>
            <p className="text-gov-200 text-xs">Civic Reporting Management System</p>
          </div>
        </div>
        {overview && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total',    value: overview.totalReports, emoji: '📋' },
              { label: 'Resolved', value: overview.resolved,     emoji: '✅' },
              { label: 'Pending',  value: overview.pending,      emoji: '⏳' },
              { label: 'Users',    value: overview.totalUsers,   emoji: '👥' },
            ].map(s => (
              <div key={s.label} className="bg-white/15 rounded-xl p-2.5 text-center">
                <p className="text-base">{s.emoji}</p>
                <p className="text-lg font-bold">{(s.value || 0).toLocaleString()}</p>
                <p className="text-[9px] text-gov-200">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={cn('flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              tab === t.key ? 'bg-white text-gov-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-civic-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-civic-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Average Resolution Time</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.avgResolutionHours || 0}h</p>
            </div>
          </div>
          {pieData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gov-600" />Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, 'Complaints']} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {monthly && monthly.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="total" name="Submitted" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {deptPerf && deptPerf.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gov-600" />Department Performance
              </h3>
              {deptPerf.slice(0, 6).map((d: any) => (
                <div key={d.department} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 truncate max-w-[65%]">{d.department}</span>
                    <span className={cn('font-bold', d.resolutionRate >= 70 ? 'text-civic-600' : d.resolutionRate >= 40 ? 'text-orange-500' : 'text-red-500')}>
                      {d.resolutionRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={cn('h-full rounded-full', d.resolutionRate >= 70 ? 'bg-civic-500' : d.resolutionRate >= 40 ? 'bg-orange-400' : 'bg-red-400')}
                      style={{ width: `${d.resolutionRate}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {d.totalAssigned} assigned · {d.resolved} resolved · {d.avgResolutionHours}h avg
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPLAINTS */}
      {tab === 'complaints' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search by title or tracking ID..." className="input pl-9 text-sm" />
              </div>
              <button type="submit" className="btn-gov btn-sm px-4">Search</button>
            </form>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['','submitted','verified','assigned','in_progress','resolved','rejected'].map(s => (
                <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
                    statusFilter === s ? 'bg-gov-600 text-white border-gov-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gov-300')}>
                  {s === '' ? 'All' : STATUS_LABELS[s as ReportStatus]}
                </button>
              ))}
            </div>
          </div>
          {loadingR ? <LoadingSpinner fullPage /> : reports.length === 0 ? (
            <div className="card py-12 text-center">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No complaints found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div key={r.id} className="card hover:shadow-card-hover transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[r.category as ReportCategory]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                          <p className="text-xs text-gray-400 font-mono">{r.trackingId}</p>
                        </div>
                        <StatusBadge status={r.status as ReportStatus} />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                        <span>{CATEGORY_LABELS[r.category as ReportCategory]}</span>
                        {r.city && <span>📍 {r.city}</span>}
                        <span>{formatDate(r.createdAt)}</span>
                        {!r.isAnonymous && r.user?.name && <span>👤 {r.user.name}</span>}
                      </div>
                      {r.citizenConfirmed === false && (
                        <p className="text-xs text-red-600 font-semibold mt-1">⚠️ Citizen says NOT resolved</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => setSelected(r)} className="btn-gov btn-sm flex-1 gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> View &amp; Respond
                    </button>
                    {r.status === 'submitted' && (
                      <button onClick={async () => {
                        const { default: axios } = await import('axios');
                        const token = useAuthStore.getState().accessToken;
                        await axios.patch(`/api/v1/reports/${r.id}/status`, { status: 'verified' },
                          { headers: { Authorization: `Bearer ${token}` } });
                        toast.success('Verified'); refetch();
                      }} className="btn-outline btn-sm text-purple-700 border-purple-200">✅ Verify</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {rData?.meta && rData.meta.totalPages > 1 && (
            <Pagination page={page} totalPages={rData.meta.totalPages}
              total={rData.meta.total} limit={rData.meta.limit} onChange={setPage} />
          )}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="space-y-3">
          {loadingU ? <LoadingSpinner fullPage /> : users.map((u: any) => (
            <div key={u.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-gov-100 rounded-xl flex items-center justify-center font-bold text-gov-700 flex-shrink-0">
                {u.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-gray-400 truncate">{u.email || u.phone || 'No contact'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={cn('badge text-[10px]', {
                  admin: 'bg-purple-100 text-purple-700',
                  citizen: 'bg-blue-100 text-blue-700',
                  government_officer: 'bg-gov-100 text-gov-700',
                  ngo: 'bg-orange-100 text-orange-700',
                }[u.role as string] || 'bg-gray-100 text-gray-600')}>
                  {u.role?.replace('_', ' ')}
                </span>
                <p className={cn('text-[10px] font-medium mt-0.5', u.isActive ? 'text-civic-600' : 'text-red-500')}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          ))}
          {uData?.meta && uData.meta.totalPages > 1 && (
            <Pagination page={page} totalPages={uData.meta.totalPages}
              total={uData.meta.total} limit={uData.meta.limit} onChange={setPage} />
          )}
        </div>
      )}

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          {categories && categories.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Complaints by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart margin={{ left: -20 }} data={categories.map((c: any) => ({
                  name: CATEGORY_LABELS[c.category as ReportCategory]?.split(' ')[0] || c.category,
                  Total: c.count, Resolved: c.resolved,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip /><Legend />
                  <Bar dataKey="Total" fill="#2563eb" radius={[4,4,0,0]} />
                  <Bar dataKey="Resolved" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {deptPerf && deptPerf.length > 0 && (
            <div className="card overflow-x-auto">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Department Scorecard</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Department','Assigned','Resolved','Rate','Avg Hrs'].map(h => (
                      <th key={h} className="text-left py-2 text-gray-500 font-semibold pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deptPerf.map((d: any) => (
                    <tr key={d.department}>
                      <td className="py-2.5 font-medium text-gray-700 pr-3 max-w-[100px] truncate">{d.department}</td>
                      <td className="py-2.5 text-gray-600">{d.totalAssigned}</td>
                      <td className="py-2.5 text-civic-600 font-semibold">{d.resolved}</td>
                      <td className="py-2.5 font-bold" style={{ color: d.resolutionRate >= 70 ? '#16a34a' : d.resolutionRate >= 40 ? '#f97316' : '#dc2626' }}>
                        {d.resolutionRate}%
                      </td>
                      <td className="py-2.5 text-gray-500">{d.avgResolutionHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROFILE */}
      {tab === 'profile' && <AdminProfile />}

      {/* Complaint detail modal */}
      {selected && (
        <ComplaintModal
          report={selected}
          onClose={() => setSelected(null)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}

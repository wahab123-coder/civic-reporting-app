import { Link } from 'react-router-dom';
import {
  Plus, FileText, Bell, MapPin, Megaphone,
  Phone, ChevronRight, Shield, Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, notificationsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS, timeAgo, cn } from '@/utils';
import { ReportCategory, ReportStatus } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const QUICK_ACTIONS = [
  { label: 'Report Issue',   icon: Plus,      to: '/citizen/report/new',   bg: 'bg-civic-600' },
  { label: 'My Reports',     icon: FileText,  to: '/citizen/my-reports',   bg: 'bg-gov-600' },
  { label: 'Nearby Issues',  icon: MapPin,    to: '/citizen/map',          bg: 'bg-orange-500' },
  { label: 'Emergency',      icon: Phone,     to: '/citizen/emergency',    bg: 'bg-red-600' },
  { label: 'Announcements',  icon: Megaphone, to: '/citizen/announcements',bg: 'bg-purple-600' },
  { label: 'Notifications',  icon: Bell,      to: '/citizen/notifications',bg: 'bg-yellow-500' },
];

const CATEGORIES = [
  { key: 'pothole',              icon: '🕳️', label: 'Pothole',         color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { key: 'drainage',             icon: '🌊', label: 'Drainage',        color: 'bg-blue-50   text-blue-700   border-blue-100' },
  { key: 'illegal_dumping',      icon: '🗑️', label: 'Dumping',         color: 'bg-red-50    text-red-700    border-red-100' },
  { key: 'traffic_light',        icon: '🚦', label: 'Traffic Light',   color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  { key: 'water_leakage',        icon: '💧', label: 'Water Leak',      color: 'bg-cyan-50   text-cyan-700   border-cyan-100' },
  { key: 'power_outage',         icon: '⚡', label: 'Power Outage',    color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { key: 'environmental_hazard', icon: '☣️', label: 'Environment',     color: 'bg-civic-50  text-civic-700  border-civic-100' },
  { key: 'security',             icon: '🔒', label: 'Security',        color: 'bg-gray-50   text-gray-700   border-gray-100' },
  { key: 'corruption',           icon: '⚖️', label: 'Corruption',      color: 'bg-rose-50   text-rose-700   border-rose-100' },
  { key: 'other',                icon: '📋', label: 'Other',           color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);

  const { data: myReports, isLoading } = useQuery({
    queryKey: ['home-reports'],
    queryFn: async () => (await reportsApi.getAll({ limit: 5, page: 1 })).data.data,
  });

  const { data: notifData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data.data,
    refetchInterval: 30000,
  });

  const reports = myReports?.data || [];
  const total   = myReports?.meta?.total || 0;
  const resolved = reports.filter((r: any) => r.status === 'resolved').length;
  const pending  = reports.filter((r: any) => !['resolved','rejected'].includes(r.status)).length;
  const unread   = notifData?.count || 0;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* Hero */}
      <div className="bg-gradient-to-r from-civic-600 to-civic-700 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-civic-100 text-sm">{greeting} 👋</p>
            <h2 className="text-xl font-bold mt-0.5">{user?.name}</h2>
            <p className="text-civic-100 text-xs mt-1">Help improve your community</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <Link to="/citizen/profile">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/40" />
                : <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
              }
            </Link>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Reports', value: total,    icon: '📋' },
            { label: 'Resolved',      value: resolved, icon: '✅' },
            { label: 'Pending',       value: pending,  icon: '⏳' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-lg">{s.icon}</p>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-civic-100 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unread notifications banner */}
      {unread > 0 && (
        <Link to="/citizen/notifications"
          className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3.5 hover:bg-yellow-100 transition-colors">
          <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-yellow-800">
              {unread} new notification{unread > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-yellow-600">Tap to view updates on your reports</p>
          </div>
          <ChevronRight className="w-4 h-4 text-yellow-500" />
        </Link>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.to} to={a.to}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-card-hover transition-all">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', a.bg)}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-gray-600 text-center leading-tight">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Report categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Report by Category</h3>
          <Link to="/citizen/report/new" className="text-xs text-civic-600 font-semibold hover:underline">
            Report Now →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map(cat => (
            <Link key={cat.key}
              to={`/citizen/report/new?category=${cat.key}`}
              className={cn('flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm', cat.color)}>
              <span className="text-xl">{cat.icon}</span>
              <span className="text-sm font-semibold">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">My Recent Reports</h3>
          <Link to="/citizen/my-reports" className="text-xs text-civic-600 font-semibold hover:underline">
            View all →
          </Link>
        </div>
        <div className="card p-0 overflow-hidden">
          {isLoading ? <LoadingSpinner fullPage /> :
           reports.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-semibold text-gray-700">No reports yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to report an issue</p>
              <Link to="/citizen/report/new" className="btn-civic btn-sm mt-4 inline-flex">
                <Plus className="w-3.5 h-3.5" /> Submit Report
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reports.map((r: any) => (
                <Link key={r.id} to={`/citizen/report/${r.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className="text-xl flex-shrink-0">
                    {CATEGORY_ICONS[r.category as ReportCategory]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      {r.trackingId && <span className="font-mono">{r.trackingId}</span>}
                      {r.trackingId && '·'}
                      {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={r.status as ReportStatus} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Community tip */}
      <div className="bg-gov-50 border border-gov-100 rounded-2xl p-4 flex gap-3">
        <div className="w-9 h-9 bg-gov-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gov-800">Community Tip</p>
          <p className="text-xs text-gov-600 mt-0.5 leading-relaxed">
            Adding a GPS location and photo to your report helps officers resolve issues 3x faster.
          </p>
        </div>
      </div>
    </div>
  );
}

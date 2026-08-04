import { FileText, Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useOverview, useRecentActivity, useByCategory } from '@/hooks/useAnalytics';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { CATEGORY_LABELS, CATEGORY_ICONS, timeAgo, cn } from '@/utils';
import { ReportCategory, ReportStatus } from '@/types';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS_HEX: Record<ReportStatus, string> = {
  submitted:   '#3b82f6',
  verified:    '#8b5cf6',
  assigned:    '#f59e0b',
  in_progress: '#f97316',
  resolved:    '#16a34a',
  rejected:    '#dc2626',
};

const CAT_COLORS = ['#3b82f6','#8b5cf6','#16a34a','#f59e0b','#f97316','#dc2626','#06b6d4','#ec4899','#84cc16','#6366f1'];

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useOverview();
  const { data: activity, isLoading: loadingActivity } = useRecentActivity(8);
  const { data: categories, isLoading: loadingCats } = useByCategory();

  if (loadingOverview) return <LoadingSpinner fullPage size="lg" />;

  const statusPieData = overview?.byStatus?.map((s) => ({
    name: s.status.replace('_', ' '),
    value: s.count,
    fill: STATUS_COLORS_HEX[s.status as ReportStatus] || '#94a3b8',
  })) || [];

  const catChartData = categories?.slice(0, 6).map((c: any, i: number) => ({
    name: CATEGORY_ICONS[c.category as ReportCategory] + ' ' + (CATEGORY_LABELS[c.category as ReportCategory] || c.category),
    value: c.count,
    fill: CAT_COLORS[i],
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={overview?.totalReports?.toLocaleString() || '0'}
          icon={FileText}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle="All time submissions"
        />
        <StatCard
          title="Resolved"
          value={overview?.resolved?.toLocaleString() || '0'}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          subtitle={`${((overview?.resolved / overview?.totalReports) * 100 || 0).toFixed(1)}% resolution rate`}
        />
        <StatCard
          title="Pending"
          value={overview?.pending?.toLocaleString() || '0'}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          subtitle="Awaiting action"
        />
        <StatCard
          title="Total Users"
          value={overview?.totalUsers?.toLocaleString() || '0'}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle={`Avg. ${overview?.avgResolutionHours}h resolution`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-600" /> Report Status Distribution
          </h3>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [v, 'Reports']} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Top categories */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" /> Top Issue Categories
          </h3>
          {loadingCats ? <LoadingSpinner fullPage /> : (
            <div className="space-y-3">
              {categories?.slice(0, 6).map((c: any, i: number) => {
                const pct = Math.round((c.count / (overview?.totalReports || 1)) * 100);
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">
                        {CATEGORY_ICONS[c.category as ReportCategory]} {CATEGORY_LABELS[c.category as ReportCategory] || c.category}
                      </span>
                      <span className="text-gray-500">{c.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Recent Activity
          </h3>
          <Link to="/reports" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </Link>
        </div>
        {loadingActivity ? <LoadingSpinner fullPage /> : (
          <div className="space-y-0 divide-y divide-gray-50">
            {activity?.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>
            )}
            {activity?.map((r: any) => (
              <Link
                key={r.id}
                to={`/reports/${r.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">
                    {CATEGORY_ICONS[r.category as ReportCategory]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.city && `${r.city} · `}{timeAgo(r.updatedAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={r.status as ReportStatus} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

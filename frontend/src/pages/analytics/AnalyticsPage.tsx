import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  useReportsByMonth, useByCategory, useDepartmentPerformance,
  useTopCities, usePriorityBreakdown, useOverview,
} from '@/hooks/useAnalytics';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FileText, CheckCircle2, Clock, TrendingUp, BarChart3, Building2 } from 'lucide-react';
import { CATEGORY_LABELS } from '@/utils';
import { ReportCategory } from '@/types';

const COLORS = ['#3b82f6','#16a34a','#f59e0b','#f97316','#8b5cf6','#ec4899','#06b6d4','#84cc16','#dc2626','#6366f1'];

export default function AnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: overview, isLoading: loadingOv } = useOverview();
  const { data: monthly, isLoading: loadingM } = useReportsByMonth(year);
  const { data: categories } = useByCategory();
  const { data: departments } = useDepartmentPerformance();
  const { data: cities } = useTopCities(8);
  const { data: priorities } = usePriorityBreakdown();

  if (loadingOv) return <LoadingSpinner fullPage size="lg" />;

  const catData = categories?.map((c: any) => ({
    name: CATEGORY_LABELS[c.category as ReportCategory] || c.category,
    Total: c.count,
    Resolved: c.resolved,
  })) || [];

  const priorityData = priorities?.map((p: any) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.count,
  })) || [];

  const cityData = cities?.map((c: any) => ({ name: c.city, Reports: c.count })) || [];

  const deptRadar = departments?.map((d: any) => ({
    dept: d.department.split(' ')[0],
    rate: d.resolutionRate,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={overview?.totalReports?.toLocaleString() || 0}
          icon={FileText} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Resolved" value={overview?.resolved?.toLocaleString() || 0}
          icon={CheckCircle2} iconColor="text-green-600" iconBg="bg-green-50"
          subtitle={`${((overview?.resolved / overview?.totalReports) * 100 || 0).toFixed(1)}% rate`} />
        <StatCard title="Pending" value={overview?.pending?.toLocaleString() || 0}
          icon={Clock} iconColor="text-orange-600" iconBg="bg-orange-50" />
        <StatCard title="Avg Resolution" value={`${overview?.avgResolutionHours}h`}
          icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50"
          subtitle="Average time to resolve" />
      </div>

      {/* Monthly trend */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-600" /> Monthly Report Trend
          </h3>
          <select
            value={year}
            onChange={(e) => setYear(+e.target.value)}
            className="input text-sm w-28"
          >
            {[2022, 2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {loadingM ? <LoadingSpinner fullPage /> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" name="Submitted" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category + Priority row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category bar */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Reports by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={catData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total" fill="#3b82f6" radius={[0,3,3,0]} />
              <Bar dataKey="Resolved" fill="#16a34a" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" outerRadius={85}
                dataKey="value" nameKey="name" paddingAngle={3} label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                } labelLine={false}>
                {priorityData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department performance + Top cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department table */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary-600" /> Department Performance
          </h3>
          {!departments?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No assignment data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-semibold">Department</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Assigned</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Resolved</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Rate</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Avg hrs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {departments?.map((d: any) => (
                    <tr key={d.department} className="hover:bg-gray-50">
                      <td className="py-2.5 font-medium text-gray-800">{d.department}</td>
                      <td className="py-2.5 text-right text-gray-600">{d.totalAssigned}</td>
                      <td className="py-2.5 text-right text-green-600 font-medium">{d.resolved}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-semibold ${d.resolutionRate >= 70 ? 'text-green-600' : d.resolutionRate >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                          {d.resolutionRate}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-gray-500">{d.avgResolutionHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top cities */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Cities by Reports</h3>
          {!cityData.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No city data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cityData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="Reports" radius={[4,4,0,0]}>
                  {cityData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Department resolution radar */}
      {deptRadar.length > 2 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Resolution Rate Radar</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={deptRadar}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <Radar name="Resolution Rate %" dataKey="rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Resolution Rate']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

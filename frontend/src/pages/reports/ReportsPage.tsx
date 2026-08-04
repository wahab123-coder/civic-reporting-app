import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FileText, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_COLORS,
  formatDate, truncate, cn,
} from '@/utils';
import {
  ReportCategory, ReportStatus, ReportPriority, ReportQueryParams,
} from '@/types';

const STATUSES: ReportStatus[] = ['submitted','verified','assigned','in_progress','resolved','rejected'];
const CATEGORIES: ReportCategory[] = [
  'pothole','drainage','illegal_dumping','traffic_light','water_leakage',
  'power_outage','environmental_hazard','security','corruption','other',
];

export default function ReportsPage() {
  const [params, setParams] = useState<ReportQueryParams>({ page: 1, limit: 15 });
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useReports(params);
  const reports = data?.data || [];
  const meta = data?.meta;

  const setFilter = (key: keyof ReportQueryParams, value: any) =>
    setParams((p) => ({ ...p, [key]: value || undefined, page: 1 }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter('search', search);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta?.total?.toLocaleString() || 0} total reports
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('btn-secondary gap-2', showFilters && 'bg-primary-50 border-primary-200 text-primary-700')}
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={cn('w-3 h-3 transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>

      {/* Search + filters */}
      <div className="card p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by title, address…"
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn-primary px-5">Search</button>
          {(params.search || params.status || params.category || params.priority) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setParams({ page: 1, limit: 15 }); }}
              className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear
            </button>
          )}
        </form>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            {/* Status */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
              <select
                value={params.status || ''}
                onChange={(e) => setFilter('status', e.target.value)}
                className="input text-sm"
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Category</label>
              <select
                value={params.category || ''}
                onChange={(e) => setFilter('category', e.target.value)}
                className="input text-sm"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
              <select
                value={params.priority || ''}
                onChange={(e) => setFilter('priority', e.target.value as ReportPriority)}
                className="input text-sm"
              >
                <option value="">All priorities</option>
                {(['low','medium','high','urgent'] as ReportPriority[]).map((p) => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Sort by</label>
              <select
                value={params.sortBy || 'createdAt'}
                onChange={(e) => setFilter('sortBy', e.target.value)}
                className="input text-sm"
              >
                <option value="createdAt">Newest first</option>
                <option value="updatedAt">Recently updated</option>
                <option value="upvotes">Most upvoted</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports found"
            description="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Report</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reporter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <Link
                          to={`/reports/${r.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600 group-hover:text-primary-600 transition-colors"
                        >
                          {truncate(r.title, 55)}
                        </Link>
                        {r.upvotes > 0 && (
                          <span className="ml-2 text-xs text-gray-400">👍 {r.upvotes}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <span>{CATEGORY_ICONS[r.category]}</span>
                          <span className="text-xs">{CATEGORY_LABELS[r.category]}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn('badge capitalize', PRIORITY_COLORS[r.priority])}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {r.city || r.address ? truncate(r.city || r.address || '', 30) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(r.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.isAnonymous ? (
                          <span className="text-xs text-gray-400 italic">Anonymous</span>
                        ) : (
                          <span className="text-xs text-gray-600">{r.user?.name || '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="border-t border-gray-100 px-4">
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  onChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

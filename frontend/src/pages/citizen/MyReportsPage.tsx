import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/api';
import { Search, Plus, Filter, FileText, ChevronRight } from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS, formatDate, cn } from '@/utils';
import { ReportCategory, ReportStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';

const STATUS_STEPS: ReportStatus[] = ['submitted','verified','assigned','in_progress','resolved'];

function StatusStepper({ status }: { status: ReportStatus }) {
  const current = STATUS_STEPS.indexOf(status);
  const isRejected = status === 'rejected';
  return (
    <div className="flex items-center gap-1 w-full mt-2">
      {isRejected ? (
        <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Rejected
        </div>
      ) : STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
            i <= current ? 'bg-civic-500' : 'bg-gray-200')} />
          {i < STATUS_STEPS.length - 1 && (
            <div className={cn('h-0.5 flex-1 mx-0.5', i < current ? 'bg-civic-400' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyReportsPage() {
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter, setShowFilter]     = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-reports', page, search, statusFilter],
    queryFn: async () => {
      const res = await reportsApi.getAll({
        page, limit: 10,
        search: search || undefined,
        status: statusFilter as ReportStatus || undefined,
      });
      return res.data.data;
    },
  });

  const reports = data?.data || [];
  const meta    = data?.meta;

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">My Reports</h2>
          <p className="section-sub">{meta?.total || 0} total reports</p>
        </div>
        <Link to="/citizen/report/new" className="btn-civic btn-sm">
          <Plus className="w-3.5 h-3.5" /> New
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchVal} onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchVal); setPage(1); }}}
              placeholder="Search your reports..." className="input pl-9" />
          </div>
          <button onClick={() => setShowFilter(!showFilter)}
            className={cn('btn-outline px-3', showFilter && 'border-civic-400 bg-civic-50 text-civic-700')}>
            <Filter className="w-4 h-4" />
          </button>
        </div>
        {showFilter && (
          <div className="flex gap-2 flex-wrap">
            {['', 'submitted','verified','assigned','in_progress','resolved','rejected'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  statusFilter === s
                    ? 'bg-civic-600 text-white border-civic-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-civic-300')}>
                {s === '' ? 'All' : STATUS_LABELS[s as ReportStatus]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? <LoadingSpinner fullPage /> :
       reports.length === 0 ? (
        <div className="card py-14 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-gray-700">No reports found</p>
          <p className="text-sm text-gray-400 mt-1">Submit your first report to get started</p>
          <Link to="/citizen/report/new" className="btn-civic btn-sm mt-4 inline-flex">
            <Plus className="w-3.5 h-3.5" /> Report Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <Link key={r.id} to={`/citizen/report/${r.id}`}
              className="card flex items-start gap-3 hover:shadow-card-hover transition-all group">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {CATEGORY_ICONS[r.category as ReportCategory]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 leading-snug truncate group-hover:text-civic-700">
                    {r.title}
                  </p>
                  <span className={cn('badge flex-shrink-0 text-[10px]', STATUS_COLORS[r.status as ReportStatus])}>
                    {STATUS_LABELS[r.status as ReportStatus]}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CATEGORY_LABELS[r.category as ReportCategory]} • {formatDate(r.createdAt)}
                </p>
                {r.city && <p className="text-xs text-gray-400">📍 {r.city}</p>}
                <StatusStepper status={r.status as ReportStatus} />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages}
          total={meta.total} limit={meta.limit} onChange={setPage} />
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/services/api';
import {
  Search, Eye, X, Copy, Send, Loader2,
  MapPin, Calendar, User, Clock, CheckCircle2,
  XCircle, Filter, ChevronDown,
} from 'lucide-react';
import {
  CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS,
  STATUS_COLORS, formatDate, formatDateTime, timeAgo, cn,
} from '@/utils';
import { ReportCategory, ReportStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

// ── Status Timeline ───────────────────────────────────────
const STATUS_STEPS: ReportStatus[] = ['submitted','verified','assigned','in_progress','resolved'];

function StatusTimeline({ status }: { status: ReportStatus }) {
  const current = STATUS_STEPS.indexOf(status);
  const isRejected = status === 'rejected';

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <XCircle className="w-3.5 h-3.5 text-red-500" />
        </div>
        <span className="text-xs font-semibold text-red-600">Complaint Rejected</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-between py-2">
      <div className="absolute left-3 right-3 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2">
        <div
          className="h-full bg-civic-500 transition-all duration-500"
          style={{ width: `${current <= 0 ? 0 : (current / (STATUS_STEPS.length - 1)) * 100}%` }}
        />
      </div>
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="relative z-10 flex flex-col items-center gap-1">
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all',
            i < current  ? 'bg-civic-600 border-civic-600 text-white' :
            i === current? 'bg-white border-civic-500 text-civic-600 shadow-sm' :
                           'bg-white border-gray-200 text-gray-300',
          )}>
            {i < current ? '✓' : i + 1}
          </div>
          <p className={cn('text-[8px] font-semibold text-center max-w-[40px] leading-tight',
            i <= current ? 'text-civic-700' : 'text-gray-300')}>
            {STATUS_LABELS[s]}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Complaint Detail Modal ────────────────────────────────
function ComplaintDetailModal({ report, onClose, onRefresh }: {
  report: any; onClose: () => void; onRefresh: () => void;
}) {
  const [comment, setComment] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState('');
  const qc = useQueryClient();

  const { data: commentsData, isLoading: loadingComments } = useQuery({
    queryKey: ['admin-modal-comments', report.id],
    queryFn: async () => (await commentsApi.getByReport(report.id)).data.data,
  });

  const addComment = useMutation({
    mutationFn: () => commentsApi.create({ content: comment, reportId: report.id }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['admin-modal-comments', report.id] });
      toast.success('Response sent to citizen');
    },
  });

  const changeStatus = async (status: string) => {
    setUpdatingStatus(status);
    try {
      const { default: axios } = await import('axios');
      const token = useAuthStore.getState().accessToken;
      await axios.patch(
        `http://localhost:3000/api/v1/reports/${report.id}/status`,
        { status, note: statusNote || `Status updated to ${status}` },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`✅ Marked as "${STATUS_LABELS[status as ReportStatus]}"`);
      qc.invalidateQueries({ queryKey: ['admin-all-complaints'] });
      onRefresh();
      onClose();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdatingStatus(''); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-float max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{CATEGORY_ICONS[report.category as ReportCategory]}</span>
              <h3 className="font-bold text-gray-900 text-sm">{report.title}</h3>
              <StatusBadge status={report.status as ReportStatus} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] font-mono text-gray-400 font-bold">{report.trackingId}</p>
              <button onClick={() => { navigator.clipboard.writeText(report.trackingId); toast.success('Copied!'); }}>
                <Copy className="w-3 h-3 text-gray-300 hover:text-gov-600" />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl ml-2 flex-shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Status Timeline */}
          <div className="card p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Complaint Progress</p>
            <StatusTimeline status={report.status as ReportStatus} />
          </div>

          {/* Complaint details grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left: complaint info */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Complaint Info</p>
              <div>
                <p className="text-[10px] text-gray-400">Category</p>
                <p className="text-xs font-semibold text-gray-800">{CATEGORY_LABELS[report.category as ReportCategory]}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Priority</p>
                <p className="text-xs font-semibold text-gray-800 capitalize">{report.priority}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Location</p>
                <p className="text-xs text-gray-700 leading-snug">
                  {[report.address, report.landmark, report.city, report.state].filter(Boolean).join(', ') || 'Not provided'}
                </p>
              </div>
              {report.upvotes > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400">Community Upvotes</p>
                  <p className="text-xs font-semibold text-gray-800">👍 {report.upvotes}</p>
                </div>
              )}
            </div>

            {/* Right: citizen info */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Citizen Info</p>
              <div className="flex items-center gap-2">
                {report.user?.avatar
                  ? <img src={report.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-civic-100 flex items-center justify-center text-sm font-bold text-civic-700 flex-shrink-0">
                      {report.isAnonymous ? '?' : report.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                }
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">
                    {report.isAnonymous ? 'Anonymous' : report.user?.name || 'Unknown'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {report.isAnonymous ? 'Identity hidden' : report.user?.email || ''}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Submitted</p>
                <p className="text-xs text-gray-700">{formatDateTime(report.createdAt)}</p>
              </div>
              {report.resolvedAt && (
                <div>
                  <p className="text-[10px] text-gray-400">Resolved</p>
                  <p className="text-xs text-civic-600 font-semibold">{formatDateTime(report.resolvedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Full Description</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{report.description}</p>
          </div>

          {/* Citizen confirmation */}
          {report.status === 'resolved' && (
            <div className={cn('p-3 rounded-xl border',
              report.citizenConfirmed === true  ? 'bg-civic-50 border-civic-200' :
              report.citizenConfirmed === false ? 'bg-red-50 border-red-200' :
                                                  'bg-yellow-50 border-yellow-200')}>
              <p className={cn('text-xs font-bold',
                report.citizenConfirmed === true  ? 'text-civic-700' :
                report.citizenConfirmed === false ? 'text-red-700' : 'text-yellow-700')}>
                Citizen Confirmation:
              </p>
              <p className={cn('text-xs mt-0.5',
                report.citizenConfirmed === true  ? 'text-civic-600' :
                report.citizenConfirmed === false ? 'text-red-600' : 'text-yellow-600')}>
                {report.citizenConfirmed === true  ? '✅ Citizen confirmed the issue is resolved' :
                 report.citizenConfirmed === false ? '⚠️ Citizen says the issue is NOT resolved — needs re-attention' :
                                                    '⏳ Waiting for citizen to confirm resolution'}
              </p>
              {report.citizenFeedback && (
                <p className="text-xs text-gray-500 mt-1 italic">"{report.citizenFeedback}"</p>
              )}
            </div>
          )}

          {/* Resolution evidence */}
          {report.resolutionEvidenceUrl && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Resolution Evidence</p>
              {report.resolutionEvidenceUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)
                ? <img src={report.resolutionEvidenceUrl} alt="Evidence" className="w-full max-h-48 object-cover rounded-xl" />
                : <a href={report.resolutionEvidenceUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-gov w-full block text-center text-sm py-2">View Evidence File</a>
              }
              {report.resolutionNote && (
                <p className="text-xs text-gray-500 mt-2 italic">"{report.resolutionNote}"</p>
              )}
            </div>
          )}

          {/* Status update actions */}
          {!['resolved','rejected'].includes(report.status) && (
            <div className="card p-3 border-l-4 border-gov-500">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Update Status</p>
              <textarea
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder="Add a note (optional)..."
                rows={2}
                className="input resize-none text-xs mb-2 w-full"
              />
              <div className="flex flex-wrap gap-2">
                {report.status === 'submitted' && (
                  <button onClick={() => changeStatus('verified')}
                    disabled={!!updatingStatus}
                    className="btn-outline btn-sm text-purple-700 border-purple-200">
                    {updatingStatus === 'verified' ? <Loader2 className="w-3 h-3 animate-spin" /> : '✅'} Verify
                  </button>
                )}
                {['submitted','verified'].includes(report.status) && (
                  <button onClick={() => changeStatus('assigned')}
                    disabled={!!updatingStatus}
                    className="btn-gov btn-sm">
                    {updatingStatus === 'assigned' ? <Loader2 className="w-3 h-3 animate-spin" /> : '📋'} Assign
                  </button>
                )}
                {['verified','assigned'].includes(report.status) && (
                  <button onClick={() => changeStatus('in_progress')}
                    disabled={!!updatingStatus}
                    className="btn-outline btn-sm text-orange-700 border-orange-200">
                    {updatingStatus === 'in_progress' ? <Loader2 className="w-3 h-3 animate-spin" /> : '🔧'} In Progress
                  </button>
                )}
                {report.status === 'in_progress' && (
                  <button onClick={() => changeStatus('resolved')}
                    disabled={!!updatingStatus}
                    className="btn-civic btn-sm">
                    {updatingStatus === 'resolved' ? <Loader2 className="w-3 h-3 animate-spin" /> : '🎉'} Mark Resolved
                  </button>
                )}
                <button onClick={() => changeStatus('rejected')}
                  disabled={!!updatingStatus}
                  className="btn-danger btn-sm">
                  {updatingStatus === 'rejected' ? <Loader2 className="w-3 h-3 animate-spin" /> : '❌'} Reject
                </button>
              </div>
            </div>
          )}

          {/* Government responses & officer comments */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">
              Government Responses &amp; Officer Actions ({commentsData?.length || 0})
            </p>
            {loadingComments ? <LoadingSpinner /> : (
              <div className="space-y-3 max-h-56 overflow-y-auto mb-3 pr-1">
                {!commentsData?.length
                  ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <p className="text-2xl mb-1">💬</p>
                      <p className="text-xs text-gray-400">No responses yet</p>
                    </div>
                  )
                  : commentsData.map((c: any) => {
                      const isGov = ['government_officer','admin'].includes(c.user?.role);
                      return (
                        <div key={c.id} className={cn('flex gap-2.5', isGov ? 'flex-row-reverse' : '')}>
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden',
                            isGov ? 'bg-gov-600 text-white' : 'bg-gray-200 text-gray-600',
                          )}>
                            {c.user?.avatar
                              ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                              : isGov ? '🏛' : c.user?.name?.charAt(0) || '?'
                            }
                          </div>
                          <div className="flex-1 max-w-[78%]">
                            <div className={cn(
                              'rounded-2xl px-3.5 py-2.5 text-sm',
                              isGov ? 'bg-gov-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm',
                            )}>
                              <p className={cn('text-[10px] font-bold mb-0.5', isGov ? 'text-gov-200' : 'text-gray-400')}>
                                {isGov
                                  ? `🏛️ ${c.user?.name} · ${c.user?.role?.replace('_',' ')}`
                                  : `👤 ${c.user?.name} · Citizen`
                                }
                              </p>
                              {c.content}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 px-1">{timeAgo(c.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            )}

            {/* Send response */}
            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && comment.trim() && addComment.mutate()}
                placeholder="Send official government response to citizen..."
                className="input flex-1 text-sm"
              />
              <button
                onClick={() => addComment.mutate()}
                disabled={!comment.trim() || addComment.isPending}
                className="btn-gov px-3"
              >
                {addComment.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminComplaintsPage() {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected]     = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-all-complaints', statusFilter, search, page],
    queryFn: async () => {
      const { default: axios } = await import('axios');
      const token = useAuthStore.getState().accessToken;
      const res = await axios.get('http://localhost:3000/api/v1/reports', {
        params: { status: statusFilter || undefined, search: search || undefined, page, limit: 15 },
        headers: { Authorization: `Bearer ${token}` },
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
          <h2 className="text-lg font-bold text-gray-900">All Citizen Complaints</h2>
          <p className="text-sm text-gray-500">{meta?.total?.toLocaleString() || 0} total complaints</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('btn-outline btn-sm gap-1.5', showFilters && 'border-gov-300 text-gov-700 bg-gov-50')}>
          <Filter className="w-3.5 h-3.5" />
          Filter
          <ChevronDown className={cn('w-3 h-3 transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>

      {/* Search + filters */}
      <div className="card p-4 space-y-3">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by title, tracking ID, or description..."
              className="input pl-9 text-sm"
            />
          </div>
          <button type="submit" className="btn-gov btn-sm px-4">Search</button>
          {(search || statusFilter) && (
            <button type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setStatus(''); setPage(1); }}
              className="btn-outline btn-sm text-red-500 border-red-200">
              Clear
            </button>
          )}
        </form>

        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-1 pt-1 border-t border-gray-100">
            {['','submitted','verified','assigned','in_progress','resolved','rejected'].map(s => (
              <button key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
                  statusFilter === s
                    ? 'bg-gov-600 text-white border-gov-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gov-300',
                )}>
                {s === '' ? 'All Statuses' : STATUS_LABELS[s as ReportStatus]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Complaints list */}
      {isLoading ? <LoadingSpinner fullPage /> :
       reports.length === 0 ? (
        <div className="card py-14 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-gray-600">No complaints found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className="card hover:shadow-card-hover transition-all">
              {/* Complaint row */}
              <div className="flex items-start gap-3">
                {/* Category icon */}
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {CATEGORY_ICONS[r.category as ReportCategory]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{r.title}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{r.trackingId}</p>
                    </div>
                    <StatusBadge status={r.status as ReportStatus} />
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                    <span className="text-xs text-gray-500">{CATEGORY_LABELS[r.category as ReportCategory]}</span>
                    {r.city && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />{r.city}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />{formatDate(r.createdAt)}
                    </span>
                    {!r.isAnonymous && r.user && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {r.user.avatar
                          ? <img src={r.user.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                          : <User className="w-3 h-3" />
                        }
                        {r.user.name}
                      </span>
                    )}
                    {r.isAnonymous && <span className="text-xs text-gray-400 italic">Anonymous</span>}
                  </div>

                  {/* Mini timeline */}
                  <div className="mt-2">
                    <StatusTimeline status={r.status as ReportStatus} />
                  </div>

                  {/* Alerts */}
                  {r.citizenConfirmed === false && (
                    <p className="text-xs text-red-600 font-semibold mt-1">
                      ⚠️ Citizen reports issue NOT resolved
                    </p>
                  )}
                  {r.citizenConfirmed === true && (
                    <p className="text-xs text-civic-600 font-semibold mt-1">
                      ✅ Citizen confirmed resolved
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setSelected(r)}
                  className="btn-gov btn-sm flex-1 gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  View Details &amp; Respond
                </button>
                {r.status === 'submitted' && (
                  <button
                    onClick={async () => {
                      const { default: axios } = await import('axios');
                      const token = useAuthStore.getState().accessToken;
                      await axios.patch(
                        `http://localhost:3000/api/v1/reports/${r.id}/status`,
                        { status: 'verified' },
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
                      toast.success('Complaint verified');
                      refetch();
                    }}
                    className="btn-outline btn-sm text-purple-700 border-purple-200 px-3">
                    ✅ Verify
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onChange={setPage}
        />
      )}

      {/* Detail modal */}
      {selected && (
        <ComplaintDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}

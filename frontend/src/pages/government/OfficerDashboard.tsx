import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, commentsApi, mediaApi } from '@/services/api';
import {
  ClipboardList, CheckCircle2, Clock, XCircle,
  ChevronRight, Upload, Send, Loader2, Filter,
  Camera, AlertTriangle, Building2,
} from 'lucide-react';
import {
  CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS,
  formatDate, timeAgo, cn,
} from '@/utils';
import { ReportStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  submitted:   'bg-blue-100 text-blue-700',
  verified:    'bg-purple-100 text-purple-700',
  assigned:    'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-orange-100 text-orange-700',
  resolved:    'bg-civic-100 text-civic-700',
  rejected:    'bg-red-100 text-red-700',
};

const NEXT_STATUS: Partial<Record<ReportStatus, { status: ReportStatus; label: string; color: string }[]>> = {
  assigned:    [{ status: 'in_progress', label: 'Start Work',  color: 'btn-gov' }],
  in_progress: [{ status: 'resolved',   label: 'Mark Resolved', color: 'btn-civic' },
                { status: 'rejected',    label: 'Reject',      color: 'btn-danger' }],
  verified:    [{ status: 'assigned',   label: 'Accept & Start', color: 'btn-gov' },
                { status: 'rejected',    label: 'Reject',      color: 'btn-danger' }],
};

function ReportCard({ report, onStatusChange }: { report: any; onStatusChange: () => void }) {
  const [expanded, setExpanded]   = useState(false);
  const [note, setNote]           = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [updating, setUpdating]   = useState(false);
  const [comment, setComment]     = useState('');
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const { data: comments } = useQuery({
    queryKey: ['comments', report.id],
    queryFn: async () => (await commentsApi.getByReport(report.id)).data.data,
    enabled: expanded,
  });

  const addComment = useMutation({
    mutationFn: () => commentsApi.create({ content: comment, reportId: report.id, isInternal: false }),
    onSuccess: () => { setComment(''); qc.invalidateQueries({ queryKey: ['comments', report.id] }); },
  });

  const nextActions = NEXT_STATUS[report.status as ReportStatus] || [];

  const handleStatus = async (status: ReportStatus) => {
    if (status === 'resolved' && !note && !evidenceUrl) {
      toast.error('Please add a resolution note or evidence URL before marking resolved');
      return;
    }
    setUpdating(true);
    try {
      const { default: axios } = await import('axios');
      const token = useAuthStore.getState().accessToken;
      await axios.patch(`/api/v1/reports/${report.id}/status`,
        { status, note, evidenceUrl: evidenceUrl || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (evidenceUrl && status === 'resolved') {
        await axios.post(`/api/v1/reports/${report.id}/evidence`,
          { evidenceUrl },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      toast.success(`Complaint marked as "${STATUS_LABELS[status]}"`);
      onStatusChange();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            {CATEGORY_ICONS[report.category]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-snug">{report.title}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{report.trackingId}</p>
              </div>
              <span className={cn('badge text-[10px] flex-shrink-0', STATUS_COLORS[report.status])}>
                {STATUS_LABELS[report.status as ReportStatus]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{CATEGORY_LABELS[report.category]}</span>
              {report.city && <span>📍 {report.city}</span>}
              <span>{formatDate(report.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {nextActions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {nextActions.map(a => (
              <button key={a.status} onClick={() => handleStatus(a.status)}
                disabled={updating}
                className={cn('flex-1 py-2 text-xs font-bold rounded-xl transition-all', a.color,
                  'flex items-center justify-center gap-1.5')}>
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {a.label}
              </button>
            ))}
            <button onClick={() => setExpanded(!expanded)}
              className="px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-600 font-medium hover:bg-gray-200">
              {expanded ? 'Less ▲' : 'More ▼'}
            </button>
          </div>
        )}
        {nextActions.length === 0 && (
          <button onClick={() => setExpanded(!expanded)}
            className="mt-3 w-full text-xs text-gray-500 flex items-center justify-center gap-1 hover:text-gray-700">
            {expanded ? 'Hide details ▲' : 'View details ▼'}
          </button>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
          <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>

          {/* Resolution fields */}
          {(report.status === 'in_progress' || report.status === 'assigned' || report.status === 'verified') && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600">Resolution Note</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder="Describe the action taken..."
                className="input resize-none text-sm w-full" />
              <label className="text-xs font-bold text-gray-600">Evidence URL (photo/video link)</label>
              <div className="flex gap-2">
                <input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
                  placeholder="https://..." className="input text-sm flex-1" />
                <button className="btn-outline btn-sm px-3">
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Citizen confirmation status */}
          {report.status === 'resolved' && (
            <div className={cn('p-3 rounded-xl text-xs font-medium',
              report.citizenConfirmed === true  ? 'bg-civic-100 text-civic-700' :
              report.citizenConfirmed === false ? 'bg-red-100 text-red-700' :
                                                  'bg-yellow-100 text-yellow-700')}>
              {report.citizenConfirmed === true  ? '✅ Citizen confirmed — Issue resolved' :
               report.citizenConfirmed === false ? '⚠️ Citizen says issue NOT resolved — needs attention' :
                                                  '⏳ Awaiting citizen confirmation'}
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Messages ({comments?.length || 0})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments?.map((c: any) => {
                const isGov = c.user?.role === 'government_officer' || c.user?.role === 'admin';
                return (
                  <div key={c.id} className={cn('flex gap-2', isGov ? 'flex-row-reverse' : '')}>
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                      isGov ? 'bg-gov-600 text-white' : 'bg-gray-200 text-gray-600')}>
                      {isGov ? '🏛' : c.user?.name?.charAt(0)}
                    </div>
                    <div className={cn('rounded-xl px-3 py-2 max-w-[80%] text-xs',
                      isGov ? 'bg-gov-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                      {c.content}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Reply to citizen..."
                className="input flex-1 text-xs"
                onKeyDown={e => e.key === 'Enter' && comment.trim() && addComment.mutate()} />
              <button onClick={() => addComment.mutate()} disabled={!comment.trim() || addComment.isPending}
                className="btn-gov px-2.5 py-2">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OfficerDashboard() {
  const [statusFilter, setStatusFilter] = useState('assigned');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['officer-reports', statusFilter, page],
    queryFn: async () => {
      const { default: axios } = await import('axios');
      const token = useAuthStore.getState().accessToken;
      const res = await axios.get('/api/v1/reports', {
        params: { status: statusFilter || undefined, page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
  });

  const reports = data?.data || [];
  const meta = data?.meta;

  const counts = {
    assigned:    reports.filter((r: any) => r.status === 'assigned').length,
    in_progress: reports.filter((r: any) => r.status === 'in_progress').length,
    resolved:    reports.filter((r: any) => r.status === 'resolved').length,
    pending_confirm: reports.filter((r: any) => r.status === 'resolved' && r.citizenConfirmed === null).length,
  };

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gov-700 to-gov-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Officer Dashboard</h2>
            <p className="text-gov-200 text-xs">Manage assigned complaints</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Assigned', value: meta?.total || 0, emoji: '📋' },
            { label: 'In Progress', value: counts.in_progress, emoji: '🔧' },
            { label: 'Resolved', value: counts.resolved, emoji: '✅' },
            { label: 'Need Confirm', value: counts.pending_confirm, emoji: '⏳' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-base">{s.emoji}</p>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[9px] text-gov-200 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { val: '',            label: 'All' },
          { val: 'verified',   label: 'Verified' },
          { val: 'assigned',   label: 'Assigned' },
          { val: 'in_progress',label: 'In Progress' },
          { val: 'resolved',   label: 'Resolved' },
        ].map(f => (
          <button key={f.val} onClick={() => { setStatusFilter(f.val); setPage(1); }}
            className={cn('px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
              statusFilter === f.val
                ? 'bg-gov-600 text-white border-gov-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gov-300')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Reports */}
      {isLoading ? <LoadingSpinner fullPage /> :
       reports.length === 0 ? (
        <div className="card py-14 text-center">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No complaints here</p>
          <p className="text-sm text-gray-400 mt-1">
            {statusFilter ? `No complaints with status "${STATUS_LABELS[statusFilter as ReportStatus]}"` : 'No complaints assigned to you'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <ReportCard key={r.id} report={r} onStatusChange={() => { refetch(); qc.invalidateQueries({ queryKey: ['officer-reports'] }); }} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="btn-outline btn-sm">← Prev</button>
          <span className="text-gray-500">Page {page} of {meta.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
            className="btn-outline btn-sm">Next →</button>
        </div>
      )}
    </div>
  );
}

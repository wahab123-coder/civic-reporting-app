import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, User, Tag, Flag,
  ThumbsUp, Loader2, CheckCircle2, XCircle, Send,
  Building2, Image as ImageIcon,
} from 'lucide-react';
import { useReport, useUpdateReportStatus } from '@/hooks/useReports';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi, assignmentsApi, departmentsApi, mediaApi } from '@/services/api';
import { reportsApi } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_COLORS,
  STATUS_LABELS, formatDateTime, timeAgo, cn,
} from '@/utils';
import { ReportStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const NEXT_STATUSES: Partial<Record<ReportStatus, ReportStatus[]>> = {
  submitted:   ['verified', 'rejected'],
  verified:    ['assigned', 'rejected'],
  assigned:    ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
};

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'government_officer';

  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');

  const { data: reportData, isLoading } = useReport(id!);
  const report = reportData;

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => (await commentsApi.getByReport(id!)).data.data,
    enabled: !!id,
  });

  const { data: mediaData } = useQuery({
    queryKey: ['media', id],
    queryFn: async () => (await mediaApi.getByReport(id!)).data.data,
    enabled: !!id,
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await departmentsApi.getAll()).data.data,
  });

  const updateStatus = useUpdateReportStatus();

  const addComment = useMutation({
    mutationFn: () => commentsApi.create({ content: comment, reportId: id!, isInternal }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['comments', id] });
      toast.success('Comment added');
    },
  });

  const upvote = useMutation({
    mutationFn: () => reportsApi.upvote(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', id] }),
  });

  const assign = useMutation({
    mutationFn: () => assignmentsApi.create({ reportId: id!, departmentId: selectedDept }),
    onSuccess: () => {
      setShowAssign(false);
      setSelectedDept('');
      qc.invalidateQueries({ queryKey: ['reports', id] });
      toast.success('Report assigned');
    },
  });

  if (isLoading) return <LoadingSpinner fullPage size="lg" />;
  if (!report) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Report not found.</p>
      <Link to="/reports" className="btn-primary mt-4">Back to Reports</Link>
    </div>
  );

  const nextStatuses = NEXT_STATUSES[report.status] || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/reports')} className="btn-ghost p-2 mt-0.5">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <span className="text-2xl">{CATEGORY_ICONS[report.category]}</span>
            <h1 className="text-xl font-bold text-gray-900 flex-1">{report.title}</h1>
          </div>
          <div className="flex items-center flex-wrap gap-3 mt-2">
            <StatusBadge status={report.status} />
            <span className={cn('badge capitalize', PRIORITY_COLORS[report.priority])}>
              {report.priority} priority
            </span>
            <span className="badge bg-gray-100 text-gray-600">{CATEGORY_LABELS[report.category]}</span>
          </div>
        </div>
        <button
          onClick={() => upvote.mutate()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="font-medium">{report.upvotes}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
          </div>

          {/* Media */}
          {mediaData && mediaData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Media ({mediaData.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mediaData.map((m: any) => (
                  <a key={m.id} href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                    {m.type === 'image' ? (
                      <img
                        src={m.fileUrl}
                        alt={m.originalName}
                        className="w-full h-32 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-gray-100">
                        <span className="text-xs">{m.type}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status actions */}
          {isAdmin && nextStatuses.length > 0 && (
            <div className="card border-l-4 border-primary-500">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h3>
              <input
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a note (optional)…"
                className="input mb-3 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus.mutate({ id: id!, status: s, note: statusNote })}
                    disabled={updateStatus.isPending}
                    className={cn(
                      'btn text-sm',
                      s === 'rejected' ? 'btn-danger' : 'btn-primary',
                    )}
                  >
                    {updateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {s === 'resolved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    {s === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> : null}
                    Mark as {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assign to department */}
          {isAdmin && report.status === 'verified' && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Assign to Department
                </h3>
                <button onClick={() => setShowAssign(!showAssign)} className="btn-ghost text-xs">
                  {showAssign ? 'Cancel' : 'Assign'}
                </button>
              </div>
              {showAssign && (
                <div className="flex gap-2">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="input flex-1 text-sm"
                  >
                    <option value="">Select department…</option>
                    {deptData?.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => assign.mutate()}
                    disabled={!selectedDept || assign.isPending}
                    className="btn-primary"
                  >
                    {assign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Comments ({commentsData?.length || 0})
            </h3>
            <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
              {commentsData?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet</p>
              )}
              {commentsData?.map((c: any) => (
                <div key={c.id} className={cn('flex gap-3', c.isInternal && 'opacity-70')}>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">{c.user?.name || 'Unknown'}</span>
                      {c.isInternal && <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">Internal</span>}
                      <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
                rows={2}
                className="input resize-none text-sm"
              />
              <div className="flex items-center justify-between">
                {isAdmin && (
                  <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Internal note (staff only)
                  </label>
                )}
                <button
                  onClick={() => addComment.mutate()}
                  disabled={!comment.trim() || addComment.isPending}
                  className="btn-primary text-xs ml-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  {addComment.isPending ? 'Posting…' : 'Post comment'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar meta */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Report Details</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Reported by</p>
                  <p className="text-gray-700 font-medium">
                    {report.isAnonymous ? 'Anonymous' : report.user?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-gray-700">
                    {[report.address, report.landmark, report.city, report.state]
                      .filter(Boolean).join(', ') || 'No location provided'}
                  </p>
                  {report.latitude && report.longitude && (
                    <a
                      href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline mt-0.5 block"
                    >
                      View on Google Maps ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="text-gray-700">{formatDateTime(report.createdAt)}</p>
                </div>
              </div>

              {report.resolvedAt && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Resolved</p>
                    <p className="text-gray-700">{formatDateTime(report.resolvedAt)}</p>
                    {report.resolutionNote && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">{report.resolutionNote}</p>
                    )}
                  </div>
                </div>
              )}

              {report.rejectionReason && (
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Rejection reason</p>
                    <p className="text-gray-700 text-xs">{report.rejectionReason}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Report ID</p>
                  <p className="text-gray-500 font-mono text-xs break-all">{report.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map mini-preview */}
          {report.latitude && report.longitude && (
            <div className="card p-0 overflow-hidden">
              <iframe
                title="Location"
                width="100%"
                height="180"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${report.latitude},${report.longitude}&zoom=15&output=embed`}
                className="border-0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, commentsApi, mediaApi } from '@/services/api';
import {
  ChevronLeft, MapPin, Calendar, ThumbsUp, Send,
  Loader2, CheckCircle2, XCircle, Copy, Image as ImageIcon,
  AlertTriangle, Clock, Building2, Share2,
} from 'lucide-react';
import ShareModal from '@/components/ui/ShareModal';
import {
  CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS,
  formatDateTime, timeAgo, cn,
} from '@/utils';
import { ReportStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const STATUS_STEPS: ReportStatus[] = ['submitted','verified','assigned','in_progress','resolved'];

const STATUS_INFO: Record<ReportStatus, { emoji: string; title: string; msg: string; color: string; bg: string }> = {
  submitted:   { emoji: '📬', title: 'Received',     msg: 'Your complaint is received and awaiting review.',           color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  verified:    { emoji: '✅', title: 'Verified',     msg: 'Your complaint has been verified by our team.',             color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  assigned:    { emoji: '📋', title: 'Assigned',     msg: 'Assigned to the responsible government department.',        color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  in_progress: { emoji: '🔧', title: 'In Progress',  msg: 'Work is underway to fix this issue.',                      color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  resolved:    { emoji: '🎉', title: 'Resolved',     msg: 'Government says this issue has been resolved.',             color: 'text-civic-700',  bg: 'bg-civic-50 border-civic-200' },
  rejected:    { emoji: '❌', title: 'Rejected',     msg: 'This complaint could not be processed.',                   color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
};

export default function CitizenReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [comment, setComment] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => (await reportsApi.getOne(id!)).data.data,
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => (await commentsApi.getByReport(id!)).data.data,
    enabled: !!id,
  });

  const { data: media } = useQuery({
    queryKey: ['media', id],
    queryFn: async () => (await mediaApi.getByReport(id!)).data.data,
    enabled: !!id,
  });

  const upvote = useMutation({
    mutationFn: () => reportsApi.upvote(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['report', id] }); toast.success('Upvoted!'); },
  });

  const addComment = useMutation({
    mutationFn: () => commentsApi.create({ content: comment, reportId: id! }),
    onSuccess: () => { setComment(''); qc.invalidateQueries({ queryKey: ['comments', id] }); toast.success('Message sent'); },
  });

  const confirmResolution = async (confirmed: boolean) => {
    setConfirmLoading(true);
    try {
      await reportsApi.update(id!, { status: confirmed ? 'resolved' : 'in_progress' } as any);
      // Call confirm endpoint
      const { default: axios } = await import('axios');
      await axios.post(`/api/v1/reports/${id}/confirm-resolution`,
        { confirmed, feedback },
        { headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } },
      );
      qc.invalidateQueries({ queryKey: ['report', id] });
      toast.success(confirmed ? '🎉 Thank you for confirming!' : '⚠️ Complaint reopened for further action');
      setShowConfirmModal(false);
    } catch { toast.error('Could not submit confirmation'); }
    finally { setConfirmLoading(false); }
  };

  const copyId = () => { navigator.clipboard.writeText(report?.trackingId || ''); toast.success('Tracking ID copied!'); };

  if (isLoading) return <LoadingSpinner fullPage size="lg" />;
  if (!report) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Complaint not found</p>
      <Link to="/citizen/my-reports" className="btn-civic mt-4 inline-flex">Back to My Reports</Link>
    </div>
  );

  const info = STATUS_INFO[report.status as ReportStatus];
  const currentStep = STATUS_STEPS.indexOf(report.status as ReportStatus);
  const isRejected = report.status === 'rejected';
  const isResolved = report.status === 'resolved';
  const needsConfirmation = isResolved && report.citizenConfirmed === null && report.citizenConfirmed === undefined;

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 truncate">Complaint Detail</h2>
          {report.trackingId && (
            <button onClick={copyId} className="flex items-center gap-1 text-xs text-civic-600 font-mono font-semibold hover:underline">
              {report.trackingId} <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', info.bg)}>
        <span className="text-2xl flex-shrink-0">{info.emoji}</span>
        <div className="flex-1">
          <p className={cn('font-bold text-sm', info.color)}>{info.title}</p>
          <p className={cn('text-xs mt-0.5 leading-relaxed', info.color, 'opacity-80')}>{info.msg}</p>
          {report.rejectionReason && (
            <p className="text-xs text-red-600 mt-1 font-medium bg-red-50 rounded-lg px-2 py-1">
              Reason: {report.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* Progress Tracker */}
      {!isRejected && (
        <div className="card">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Complaint Progress</p>
          <div className="relative flex justify-between">
            {/* Connecting line */}
            <div className="absolute top-4 left-[8%] right-[8%] h-0.5 bg-gray-200">
              <div className="h-full bg-civic-500 transition-all duration-700"
                style={{ width: `${currentStep < 0 ? 0 : (currentStep / (STATUS_STEPS.length - 1)) * 100}%` }} />
            </div>
            {STATUS_STEPS.map((s, i) => {
              const done    = i < currentStep;
              const active  = i === currentStep;
              const pending = i > currentStep;
              return (
                <div key={s} className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                    done   ? 'bg-civic-600 border-civic-600 text-white shadow-sm' :
                    active ? 'bg-white border-civic-500 text-civic-600 shadow-md ring-4 ring-civic-100' :
                             'bg-white border-gray-200 text-gray-300')}>
                    {done ? '✓' : i + 1}
                  </div>
                  <p className={cn('text-[9px] text-center font-semibold leading-tight max-w-[50px]',
                    done || active ? 'text-civic-700' : 'text-gray-300')}>
                    {STATUS_LABELS[s]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Citizen Confirmation */}
      {isResolved && report.citizenConfirmed === null && (
        <div className="bg-civic-50 border-2 border-civic-300 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-civic-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-civic-800 text-sm">Action Required</p>
              <p className="text-xs text-civic-600 mt-0.5 leading-relaxed">
                Government has marked this issue as resolved. Is it actually fixed?
              </p>
              {report.resolutionEvidenceUrl && (
                <a href={report.resolutionEvidenceUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-civic-700 font-semibold underline mt-1 block">
                  View resolution evidence →
                </a>
              )}
            </div>
          </div>
          <div className="mt-4">
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="Optional: Share your feedback..."
              rows={2} className="input resize-none text-sm mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => confirmResolution(true)} disabled={confirmLoading}
                className="btn-civic py-2.5 text-sm font-bold">
                {confirmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Yes, It's Fixed!
              </button>
              <button onClick={() => confirmResolution(false)} disabled={confirmLoading}
                className="btn-danger py-2.5 text-sm font-bold">
                {confirmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Not Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Already Confirmed */}
      {isResolved && report.citizenConfirmed !== null && (
        <div className={cn('p-4 rounded-2xl border', report.citizenConfirmed ? 'bg-civic-50 border-civic-200' : 'bg-orange-50 border-orange-200')}>
          <p className={cn('text-sm font-bold', report.citizenConfirmed ? 'text-civic-700' : 'text-orange-700')}>
            {report.citizenConfirmed ? '✅ You confirmed this issue is resolved' : '⚠️ You reported this is not yet resolved'}
          </p>
          {report.citizenFeedback && (
            <p className="text-xs text-gray-500 mt-1 italic">"{report.citizenFeedback}"</p>
          )}
          {report.citizenConfirmedAt && (
            <p className="text-xs text-gray-400 mt-1">{formatDateTime(report.citizenConfirmedAt)}</p>
          )}
        </div>
      )}

      {/* Report Info Card */}
      <div className="card space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{CATEGORY_ICONS[report.category]}</span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{report.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABELS[report.category]}</p>
          </div>
          <button onClick={() => upvote.mutate()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-civic-50 hover:text-civic-600 hover:border-civic-300 transition-all">
            <ThumbsUp className="w-3.5 h-3.5" /> {report.upvotes}
          </button>
          <button onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-civic-600 text-white text-xs font-semibold hover:bg-civic-700 transition-all">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
        <div className="space-y-2 pt-3 border-t border-gray-100">
          {(report.address || report.city) && (
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>{[report.address, report.landmark, report.city, report.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Submitted {formatDateTime(report.createdAt)}</span>
          </div>
          {report.resolvedAt && (
            <div className="flex items-center gap-2 text-sm text-civic-600">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Resolved {formatDateTime(report.resolvedAt)}</span>
            </div>
          )}
          {report.autoRoutedDepartmentId && (
            <div className="flex items-center gap-2 text-sm text-gov-600">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span>Auto-routed to government department</span>
            </div>
          )}
          {report.latitude && (
            <a href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gov-600 hover:underline">
              <MapPin className="w-4 h-4" /> View location on Google Maps →
            </a>
          )}
        </div>
      </div>

      {/* Resolution Evidence */}
      {report.resolutionEvidenceUrl && (
        <div className="card">
          <p className="text-sm font-bold text-gray-900 mb-3">🏛️ Government Resolution Evidence</p>
          {report.resolutionEvidenceUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
            <img src={report.resolutionEvidenceUrl} alt="Resolution evidence"
              className="w-full rounded-xl object-cover max-h-60" />
          ) : (
            <a href={report.resolutionEvidenceUrl} target="_blank" rel="noopener noreferrer"
              className="btn-gov w-full block text-center">View Evidence File</a>
          )}
          {report.resolutionNote && (
            <p className="text-sm text-gray-600 mt-3 italic">"{report.resolutionNote}"</p>
          )}
        </div>
      )}

      {/* Media */}
      {media && media.length > 0 && (
        <div className="card">
          <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Submitted Evidence ({media.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {media.map((m: any) => (
              <a key={m.id} href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                {m.type === 'image'
                  ? <img src={m.fileUrl} alt="" className="w-full h-24 object-cover rounded-xl" />
                  : <div className="h-24 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">🎥</div>
                }
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Comments / Government Response */}
      <div className="card">
        <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          💬 Government Response & Messages ({comments?.length || 0})
        </p>
        <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
          {!comments?.length && (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No responses yet</p>
              <p className="text-xs text-gray-300 mt-0.5">Government officers will respond here</p>
            </div>
          )}
          {comments?.map((c: any) => {
            const isGov = c.user?.role === 'government_officer' || c.user?.role === 'admin';
            return (
              <div key={c.id} className={cn('flex gap-2.5', isGov ? 'flex-row-reverse' : '')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isGov ? 'bg-gov-600 text-white' : 'bg-gray-200 text-gray-600')}>
                  {isGov ? '🏛️' : (c.user?.name?.charAt(0) || '?')}
                </div>
                <div className={cn('flex-1 max-w-[80%]')}>
                  <div className={cn('rounded-2xl px-3.5 py-2.5',
                    isGov ? 'bg-gov-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm')}>
                    {isGov && <p className="text-[10px] font-bold text-gov-200 mb-1">🏛️ Government Officer</p>}
                    <p className="text-sm leading-relaxed">{c.content}</p>
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
            placeholder="Ask a question or add a comment..."
            className="input flex-1 text-sm" />
          <button onClick={() => addComment.mutate()} disabled={!comment.trim() || addComment.isPending}
            className="btn-civic px-3">
            {addComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {showShare && (
        <ShareModal
          report={report}
          governmentResponse={report.resolutionNote}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

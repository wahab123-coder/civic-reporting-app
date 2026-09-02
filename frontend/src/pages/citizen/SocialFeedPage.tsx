import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { Share2, Filter } from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS, timeAgo, cn } from '@/utils';
import { ReportCategory, ReportStatus } from '@/types';
import ShareModal from '@/components/ui/ShareModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const FEED_TYPES = [
  { key: 'all',        label: 'All',                  emoji: '📱', color: 'bg-gray-600' },
  { key: 'submitted',  label: 'New Reports',           emoji: '🔴', color: 'bg-red-500' },
  { key: 'in_progress',label: 'Gov Responses',         emoji: '🟡', color: 'bg-yellow-500' },
  { key: 'resolved',   label: 'Resolved Issues',       emoji: '🟢', color: 'bg-civic-500' },
  { key: 'verified',   label: 'Gov Projects',          emoji: '🔵', color: 'bg-blue-500' },
];

export default function SocialFeedPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [shareReport, setShareReport]   = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['social-feed', activeFilter],
    queryFn: async () => {
      const res = await reportsApi.getAll({
        status: activeFilter !== 'all' ? activeFilter as ReportStatus : undefined,
        limit: 20,
        page: 1,
        sortBy: 'updatedAt',
        sortOrder: 'DESC',
      });
      return res.data.data?.data || [];
    },
  });

  const STATUS_FEED_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
    submitted:   { emoji: '🔴', label: 'New Report',          color: 'bg-red-50 border-red-200' },
    verified:    { emoji: '🔵', label: 'Verified by Gov',     color: 'bg-blue-50 border-blue-200' },
    assigned:    { emoji: '🟡', label: 'Gov Assigned',        color: 'bg-yellow-50 border-yellow-200' },
    in_progress: { emoji: '🟠', label: 'Work In Progress',    color: 'bg-orange-50 border-orange-200' },
    resolved:    { emoji: '🟢', label: 'Issue Resolved',      color: 'bg-civic-50 border-civic-200' },
    rejected:    { emoji: '⚫', label: 'Report Closed',       color: 'bg-gray-50 border-gray-200' },
  };

  return (
    <div className="space-y-4 pb-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="section-title flex items-center gap-2">
          📱 Social Activity Feed
        </h2>
        <p className="section-sub">Live civic updates — share to raise awareness</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FEED_TYPES.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
              activeFilter === f.key
                ? `${f.color} text-white border-transparent`
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
            )}
          >
            <span>{f.emoji}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {isLoading ? <LoadingSpinner fullPage /> :
       !data?.length ? (
        <div className="card py-14 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-gray-600">No updates yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to report a civic issue</p>
          <Link to="/citizen/report/new" className="btn-civic btn-sm mt-4 inline-flex">
            Report an Issue
          </Link>
        </div>
       ) : (
        <div className="space-y-3">
          {data.map((r: any) => {
            const feedInfo = STATUS_FEED_LABELS[r.status] || STATUS_FEED_LABELS.submitted;
            return (
              <div key={r.id} className={cn('bg-white rounded-2xl border p-4 shadow-card', feedInfo.color)}>
                {/* Feed type badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{feedInfo.emoji}</span>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      {feedInfo.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{timeAgo(r.updatedAt)}</span>
                </div>

                {/* Report content */}
                <Link to={`/citizen/report/${r.id}`} className="block group">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[r.category as ReportCategory]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-snug group-hover:text-civic-600 transition-colors">
                        {r.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {CATEGORY_LABELS[r.category as ReportCategory]}
                        {r.city && <> · 📍 {r.city}</>}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Resolution note */}
                {r.resolutionNote && (
                  <div className="mt-3 p-2.5 bg-civic-50 rounded-xl border border-civic-100">
                    <p className="text-[10px] font-bold text-civic-600 mb-0.5">🏛️ Government Response</p>
                    <p className="text-xs text-civic-700 italic">"{r.resolutionNote}"</p>
                  </div>
                )}

                {/* Tracking ID + Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">{r.trackingId}</span>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400">👍 {r.upvotes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/citizen/report/${r.id}`}
                      className="text-xs text-civic-600 font-semibold hover:underline">
                      View →
                    </Link>
                    <button
                      onClick={() => setShareReport(r)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-civic-600 text-white rounded-lg text-[11px] font-semibold hover:bg-civic-700 transition-all"
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                  </div>
                </div>

                {/* Quick share row */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-gray-50 overflow-x-auto">
                  {[
                    { label: '𝕏', url: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${r.title} - Tracking: ${r.trackingId}`)}&url=${encodeURIComponent(window.location.origin + '/login?track=' + r.trackingId)}` },
                    { label: '📘', url: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/login?track=' + r.trackingId)}` },
                    { label: '💬', url: () => `https://wa.me/?text=${encodeURIComponent(`Civic Report: ${r.title}\nTracking: ${r.trackingId}\n${window.location.origin}/login?track=${r.trackingId}`)}` },
                    { label: '✈️', url: () => `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/login?track=' + r.trackingId)}&text=${encodeURIComponent(r.title)}` },
                    { label: '💼', url: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/login?track=' + r.trackingId)}` },
                  ].map((s, i) => (
                    <button key={i}
                      onClick={() => window.open(s.url(), '_blank', 'width=600,height=400')}
                      className="flex-shrink-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110">
                      {s.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/login?track=${r.trackingId}`);
                      toast.success('Link copied!');
                    }}
                    className="flex-shrink-0 px-2.5 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-semibold text-gray-600 transition-all flex items-center gap-1">
                    🔗 Copy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
       )}

      {/* Share Modal */}
      {shareReport && (
        <ShareModal
          report={shareReport}
          governmentResponse={shareReport.resolutionNote}
          onClose={() => setShareReport(null)}
        />
      )}
    </div>
  );
}

// Fix missing import
import toast from 'react-hot-toast';

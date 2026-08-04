import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { timeAgo, cn } from '@/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Notification, NotificationType } from '@/types';
import toast from 'react-hot-toast';

const TYPE_ICONS: Record<NotificationType, string> = {
  report_submitted:   '📬',
  report_verified:    '✅',
  report_assigned:    '📋',
  report_in_progress: '🔧',
  report_resolved:    '🎉',
  report_rejected:    '❌',
  comment_added:      '💬',
  system:             '📢',
};

const TYPE_BG: Record<NotificationType, string> = {
  report_submitted:   'bg-blue-100',
  report_verified:    'bg-purple-100',
  report_assigned:    'bg-yellow-100',
  report_in_progress: 'bg-orange-100',
  report_resolved:    'bg-civic-100',
  report_rejected:    'bg-red-100',
  comment_added:      'bg-gov-100',
  system:             'bg-gray-100',
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationsApi.getAll({ limit: 30 })).data.data,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success('All marked as read');
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const notifications: Notification[] = data?.data || [];
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-4 pb-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Notifications</h2>
          <p className="section-sub">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAll.mutate()} disabled={markAll.isPending}
            className="btn-outline btn-sm gap-1.5">
            {markAll.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? <LoadingSpinner fullPage /> :
       notifications.length === 0 ? (
        <div className="card py-16 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">Updates about your complaints will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <button key={n.id} onClick={() => !n.isRead && markOne.mutate(n.id)}
              className={cn('w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all',
                n.isRead ? 'bg-white border-gray-100' : 'bg-civic-50 border-civic-200 shadow-sm')}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0', TYPE_BG[n.type])}>
                {TYPE_ICONS[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm font-semibold leading-snug', n.isRead ? 'text-gray-700' : 'text-gray-900')}>
                    {n.title}
                  </p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-civic-500 flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1.5">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

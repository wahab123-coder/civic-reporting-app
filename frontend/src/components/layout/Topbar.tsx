import { useState, useEffect } from 'react';
import { Bell, Search, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/reports':     'Reports',
  '/map':         'Issue Map',
  '/analytics':   'Analytics',
  '/users':       'User Management',
  '/departments': 'Departments',
};

export default function Topbar() {
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const title = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/reports/') ? 'Report Detail' : 'Civic Reporting');

  useEffect(() => {
    notificationsApi.getUnreadCount()
      .then((r) => setUnread(r.data?.data?.count || 0))
      .catch(() => {});
  }, [location.pathname]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          title="Refresh data"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

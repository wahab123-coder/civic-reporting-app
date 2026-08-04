import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Home, FileText, Plus, Bell, User,
  Map, Megaphone, MessageSquare, Phone, Shield,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils';

const NAV = [
  { to: '/citizen/home',          icon: Home,          label: 'Home' },
  { to: '/citizen/my-reports',    icon: FileText,      label: 'Reports' },
  { to: '/citizen/report/new',    icon: Plus,          label: 'Report',  primary: true },
  { to: '/citizen/notifications', icon: Bell,          label: 'Alerts' },
  { to: '/citizen/profile',       icon: User,          label: 'Profile' },
];

export default function CitizenLayout() {
  const user = useAuthStore(s => s.user);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data.data,
    refetchInterval: 30000,
  });
  const unread = unreadData?.count || 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-lg mx-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-civic-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">CivicReport</p>
            <p className="text-[10px] text-gray-400">Your voice matters</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/citizen/notifications" className="relative p-2 text-gray-500 hover:text-civic-600 hover:bg-civic-50 rounded-xl transition-all">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
          <NavLink to="/citizen/profile" className="w-8 h-8 rounded-full bg-civic-100 flex items-center justify-center font-bold text-civic-700 text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'C'}
          </NavLink>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 z-30 bg-white border-t border-gray-100 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV.map(({ to, icon: Icon, label, primary }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all',
                primary
                  ? 'relative -top-4 bg-civic-600 text-white shadow-float w-14 h-14 rounded-2xl flex-col gap-0.5 items-center justify-center'
                  : isActive
                    ? 'text-civic-600'
                    : 'text-gray-400 hover:text-gray-600',
              )}>
              {({ isActive }) => (
                <>
                  <Icon className={cn('flex-shrink-0', primary ? 'w-6 h-6' : 'w-5 h-5')} />
                  <span className={cn('text-[9px] font-semibold', primary ? 'text-white' : '')}>{label}</span>
                  {!primary && isActive && (
                    <span className="w-1 h-1 rounded-full bg-civic-600 absolute bottom-1" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

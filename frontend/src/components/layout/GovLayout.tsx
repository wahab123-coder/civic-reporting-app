import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Map, BarChart3, Users,
  Building2, LogOut, Shield, Bell, Menu, X,
  ClipboardList, UserCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi, notificationsApi } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

const ADMIN_NAV = [
  { to: '/gov/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/gov/complaints',  icon: FileText,        label: 'All Complaints' },
  { to: '/gov/map',         icon: Map,             label: 'Issue Map' },
  { to: '/gov/analytics',   icon: BarChart3,       label: 'Analytics' },
  { to: '/gov/users',       icon: Users,           label: 'Users' },
  { to: '/gov/departments', icon: Building2,       label: 'Departments' },
  { to: '/gov/profile',     icon: UserCircle,      label: 'My Profile' },
];

const OFFICER_NAV = [
  { to: '/gov/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/gov/assigned',  icon: ClipboardList,   label: 'My Assignments' },
  { to: '/gov/map',       icon: Map,             label: 'Issue Map' },
  { to: '/gov/profile',   icon: UserCircle,      label: 'My Profile' },
];

export default function GovLayout() {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const { user, logout }              = useAuthStore();
  const navigate                      = useNavigate();
  const isAdmin                       = user?.role === 'admin';
  const NAV                           = isAdmin ? ADMIN_NAV : OFFICER_NAV;

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data.data,
    refetchInterval: 30000,
  });
  const unread = unreadData?.count || 0;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout(); toast.success('Logged out'); navigate('/login');
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} onClick={onClick}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            isActive ? 'bg-civic-600 text-white shadow-sm' : 'text-gov-300 hover:bg-gov-800 hover:text-white',
            collapsed && !mobileOpen && 'justify-center px-2',
          )}
          title={collapsed && !mobileOpen ? label : undefined}>
          <Icon className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobileOpen) && <span>{label}</span>}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-gov-900 text-white transition-all duration-300 flex-shrink-0 relative',
        collapsed ? 'w-16' : 'w-60',
      )}>
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 bg-gov-700 border border-gov-600 rounded-full flex items-center justify-center hover:bg-gov-600 shadow-md">
          {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
        </button>

        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gov-700/50', collapsed && 'justify-center px-2')}>
          <div className="w-8 h-8 bg-civic-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-sm leading-tight">CivicReport</p>
              <p className="text-[10px] text-gov-400">{isAdmin ? 'Admin Portal' : 'Officer Portal'}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className={cn('border-t border-gov-700/50 p-3', collapsed && 'px-2')}>
          {!collapsed && user && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-civic-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
              }
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">{user.name}</p>
                <p className="text-[10px] text-gov-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className={cn('flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gov-400 hover:bg-red-600/20 hover:text-red-400 transition-all', collapsed && 'justify-center px-2')}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-gov-900 text-white flex flex-col transition-transform duration-300 lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-gov-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-civic-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">CivicReport</p>
              <p className="text-[10px] text-gov-400">{isAdmin ? 'Admin Portal' : 'Officer Portal'}</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-gov-800 rounded-xl">
            <X className="w-5 h-5 text-gov-300" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <NavLinks onClick={() => setMobileOpen(false)} />
        </nav>

        <div className="border-t border-gov-700/50 p-3">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-civic-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
              }
              <div>
                <p className="text-xs font-semibold">{user.name}</p>
                <p className="text-[10px] text-gov-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gov-400 hover:bg-red-600/20 hover:text-red-400 transition-all">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-200 flex-shrink-0 gap-3">
          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl">
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <p className="font-semibold text-gray-900 text-sm">
              {isAdmin ? '🏛️ Government Administration' : '⚙️ Field Officer Portal'}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <NavLink to="/gov/notifications"
              className="relative p-2 text-gray-500 hover:text-gov-600 hover:bg-gov-50 rounded-xl transition-all">
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
            <NavLink to="/gov/profile" className="flex items-center gap-2 pl-2 border-l border-gray-200">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full bg-gov-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
              }
              <p className="text-xs font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">{user?.name}</p>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Map, BarChart3,
  Users, Building2, LogOut, Shield, ChevronLeft, ChevronRight,
  Bell,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Reports',     icon: FileText,        to: '/reports' },
  { label: 'Map',         icon: Map,             to: '/map' },
  { label: 'Analytics',   icon: BarChart3,       to: '/analytics' },
  { label: 'Users',       icon: Users,           to: '/users' },
  { label: 'Departments', icon: Building2,       to: '/departments' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 shadow-md"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-700/50', collapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm leading-tight">Civic Reporting</p>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className={cn('border-t border-gray-700/50 p-3', collapsed && 'px-2')}>
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-all',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

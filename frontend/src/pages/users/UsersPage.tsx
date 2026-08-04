import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/services/api';
import { Search, UserCheck, UserX, Shield, Users } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { formatDate, cn } from '@/utils';
import { User, UserRole } from '@/types';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<UserRole, string> = {
  admin:             'bg-purple-100 text-purple-700',
  citizen:           'bg-blue-100 text-blue-700',
  government_officer:'bg-green-100 text-green-700',
  ngo:               'bg-orange-100 text-orange-700',
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: async () => {
      const res = await usersApi.getAll({
        page, limit: 15,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      return res.data.data;
    },
  });

  const users: User[] = data?.data || [];
  const meta = data?.meta;

  const activate = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User activated'); },
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deactivated'); },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{meta?.total?.toLocaleString() || 0} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name…"
                className="input pl-9 text-sm"
              />
            </div>
            <button type="submit" className="btn-primary px-4">Search</button>
          </form>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
            className="input text-sm w-44"
          >
            <option value="">All roles</option>
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
            <option value="government_officer">Government Officer</option>
            <option value="ngo">NGO</option>
          </select>
          {(search || roleFilter) && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setRoleFilter(''); setPage(1); }}
              className="btn-ghost text-red-500 text-sm">Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingSpinner fullPage /> : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Try adjusting your filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['User','Role','Status','Email / Phone','Joined','Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge capitalize', ROLE_COLORS[u.role])}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge', u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {u.email || u.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <button
                            onClick={() => deactivate.mutate(u.id)}
                            disabled={deactivate.isPending}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            <UserX className="w-3.5 h-3.5" /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => activate.mutate(u.id)}
                            disabled={activate.isPending}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="border-t border-gray-100 px-4">
                <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

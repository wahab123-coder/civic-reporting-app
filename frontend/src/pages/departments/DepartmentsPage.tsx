import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { departmentsApi } from '@/services/api';
import { Building2, Plus, Pencil, Trash2, X, Loader2, Mail, Phone } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { Department } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  headName: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function DeptModal({ dept, onClose }: { dept?: Department; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: dept ? {
      name: dept.name, description: dept.description || '',
      contactEmail: dept.contactEmail || '', contactPhone: dept.contactPhone || '',
      headName: dept.headName || '',
    } : {},
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      dept ? departmentsApi.update(dept.id, data) : departmentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success(dept ? 'Department updated' : 'Department created');
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{dept ? 'Edit Department' : 'Add Department'}</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Department name *</label>
            <input {...register('name')} className={cn('input', errors.name && 'border-red-400')} placeholder="Roads & Infrastructure" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
            <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Handles potholes, road damage…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Contact email</label>
              <input {...register('contactEmail')} type="email" className={cn('input', errors.contactEmail && 'border-red-400')} placeholder="dept@govt.ng" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Contact phone</label>
              <input {...register('contactPhone')} className="input" placeholder="+234…" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Department head</label>
            <input {...register('headName')} className="input" placeholder="Engr. Adebayo" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {dept ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const [modal, setModal] = useState<'create' | Department | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await departmentsApi.getAll()).data.data as Department[],
  });

  const remove = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department deactivated'); },
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data?.length || 0} active departments</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {isLoading ? <LoadingSpinner fullPage /> : !data?.length ? (
        <div className="card">
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Add government departments to start assigning reports."
            action={<button onClick={() => setModal('create')} className="btn-primary"><Plus className="w-4 h-4" />Add Department</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((dept) => (
            <div key={dept.id} className="card hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setModal(dept)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Deactivate this department?')) remove.mutate(dept.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{dept.name}</h3>
              {dept.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dept.description}</p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                {dept.headName && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span className="font-medium">Head:</span> {dept.headName}
                  </p>
                )}
                {dept.contactEmail && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <a href={`mailto:${dept.contactEmail}`} className="hover:text-primary-600 truncate">{dept.contactEmail}</a>
                  </p>
                )}
                {dept.contactPhone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 flex-shrink-0" /> {dept.contactPhone}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <DeptModal
          dept={modal === 'create' ? undefined : modal as Department}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/services/api';
import { ReportQueryParams } from '@/types';
import toast from 'react-hot-toast';

export const REPORTS_KEY = 'reports';

export function useReports(params?: ReportQueryParams) {
  return useQuery({
    queryKey: [REPORTS_KEY, params],
    queryFn: async () => {
      const res = await reportsApi.getAll(params);
      return res.data.data;
    },
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: [REPORTS_KEY, id],
    queryFn: async () => {
      const res = await reportsApi.getOne(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      reportsApi.updateStatus(id, { status, note }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [REPORTS_KEY] });
      qc.invalidateQueries({ queryKey: [REPORTS_KEY, id] });
      toast.success('Status updated');
    },
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REPORTS_KEY] });
      toast.success('Report deleted');
    },
  });
}

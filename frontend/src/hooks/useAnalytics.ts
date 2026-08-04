import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api';

export function useOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => (await analyticsApi.getOverview()).data.data,
    staleTime: 1000 * 60 * 2,
  });
}

export function useReportsByMonth(year?: number) {
  return useQuery({
    queryKey: ['analytics', 'monthly', year],
    queryFn: async () => (await analyticsApi.getReportsByMonth(year)).data.data,
  });
}

export function useByCategory() {
  return useQuery({
    queryKey: ['analytics', 'category'],
    queryFn: async () => (await analyticsApi.getByCategory()).data.data,
  });
}

export function useDepartmentPerformance() {
  return useQuery({
    queryKey: ['analytics', 'departments'],
    queryFn: async () => (await analyticsApi.getDepartmentPerformance()).data.data,
  });
}

export function useTopCities(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'cities', limit],
    queryFn: async () => (await analyticsApi.getTopCities(limit)).data.data,
  });
}

export function usePriorityBreakdown() {
  return useQuery({
    queryKey: ['analytics', 'priority'],
    queryFn: async () => (await analyticsApi.getPriorityBreakdown()).data.data,
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'activity', limit],
    queryFn: async () => (await analyticsApi.getRecentActivity(limit)).data.data,
    refetchInterval: 1000 * 60,
  });
}

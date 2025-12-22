// Hook for fetching and managing schema data

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const useSchema = (database: string) => {
  return useQuery({
    queryKey: ['schema', database],
    queryFn: () => apiClient.getSchema(database),
    enabled: !!database,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useHistory = (
  database?: string,
  startDate?: string,
  endDate?: string,
  status?: string
) => {
  return useQuery({
    queryKey: ['history', database, startDate, endDate, status],
    queryFn: () => apiClient.getHistory(database, startDate, endDate, status),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useAnalytics = (database?: string) => {
  return useQuery({
    queryKey: ['analytics', database],
    queryFn: () => apiClient.getAnalytics(database),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

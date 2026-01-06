// Hook for translating natural language to SQL

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { TranslateResponse } from '@/lib/types';

export const useTranslate = () => {
  return useMutation({
    mutationFn: async ({ query, database }: { query: string; database: string }) => {
      return apiClient.translate(query, database);
    },
  });
};

export const useExplain = () => {
  return useMutation({
    mutationFn: async (sql: string) => {
      return apiClient.explain(sql);
    },
  });
};

export const useValidate = () => {
  return useMutation({
    mutationFn: async (sql: string) => {
      return apiClient.validate(sql);
    },
  });
};

export const useExecute = () => {
  return useMutation({
    mutationFn: async ({ sql, database }: { sql: string; database: string }) => {
      return apiClient.execute(sql, database);
    },
  });
};

export const useOptimize = () => {
  return useMutation({
    mutationFn: async ({ sql, database }: { sql: string; database: string }) => {
      return apiClient.optimize(sql, database);
    },
  });
};

export const useDebug = () => {
  return useMutation({
    mutationFn: async ({ sql, error, database }: { sql: string; error: string; database: string }) => {
      return apiClient.debug(sql, error, database);
    },
  });
};

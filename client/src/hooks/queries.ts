import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Account, Analytics, CalendarData, Guardrails, Range, Trade, TradeFilters, TradeList } from '@/types';

export const useAccounts = () =>
  useQuery({ queryKey: ['accounts'], queryFn: async () => (await api.get<{ accounts: Account[] }>('/accounts')).data.accounts });

export const useAnalytics = (account: string, range: Range) =>
  useQuery({
    queryKey: ['analytics', account, range],
    queryFn: async () => (await api.get<Analytics>('/analytics', { params: { account, range } })).data,
    placeholderData: keepPreviousData,
  });

export const useCalendar = (account: string, month: string) =>
  useQuery({
    queryKey: ['calendar', account, month],
    queryFn: async () =>
      (await api.get<CalendarData>('/analytics/calendar', { params: { account, month, offset: new Date().getTimezoneOffset() } })).data,
    placeholderData: keepPreviousData,
  });

export const useGuardrails = (account: string) =>
  useQuery({
    queryKey: ['guardrails', account],
    queryFn: async () => {
      const from = new Date(); from.setHours(0, 0, 0, 0);
      return (await api.get<Guardrails>('/analytics/guardrails', { params: { account, from: from.toISOString() } })).data;
    },
  });

export const useTrades = (account: string, filters: TradeFilters = {}) =>
  useQuery({
    queryKey: ['trades', account, filters],
    queryFn: async () => (await api.get<TradeList>('/trades', { params: { account, ...filters } })).data,
    placeholderData: keepPreviousData,
  });

export const useFilterOptions = (account: string) =>
  useQuery({
    queryKey: ['trade-filters', account],
    queryFn: async () => (await api.get<{ setups: string[]; tags: string[] }>('/trades/filters', { params: { account } })).data,
  });

/** Any trade change invalidates everything derived from trades. */
function useInvalidateTrades() {
  const qc = useQueryClient();
  return () => {
    for (const k of ['trades', 'analytics', 'calendar', 'guardrails', 'trade-filters']) qc.invalidateQueries({ queryKey: [k] });
  };
}

export const useSaveTrade = () => {
  const invalidate = useInvalidateTrades();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Record<string, unknown> }) =>
      (id ? await api.put<{ trade: Trade }>(`/trades/${id}`, data) : await api.post<{ trade: Trade }>('/trades', data)).data.trade,
    onSuccess: invalidate,
  });
};

export const useDeleteTrades = () => {
  const invalidate = useInvalidateTrades();
  return useMutation({
    mutationFn: async (ids: string[]) => (await api.post('/trades/bulk-delete', { ids })).data,
    onSuccess: invalidate,
  });
};

export const useImportTrades = () => {
  const invalidate = useInvalidateTrades();
  return useMutation({
    mutationFn: async ({ file, account }: { file: File; account: string }) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('account', account);
      return (await api.post<{ imported: number; duplicates: number; skipped: number }>('/imports', fd)).data;
    },
    onSuccess: invalidate,
  });
};

export const useSaveAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Partial<Account> }) =>
      (id ? await api.patch(`/accounts/${id}`, data) : await api.post('/accounts', data)).data,
    onSuccess: () => qc.invalidateQueries(),
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/accounts/${id}`)).data,
    onSuccess: () => qc.invalidateQueries(),
  });
};

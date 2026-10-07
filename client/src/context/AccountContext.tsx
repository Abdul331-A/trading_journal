import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useAccounts } from '@/hooks/queries';
import type { Account } from '@/types';

interface Ctx {
  accounts: Account[];
  activeId: string; // 'all' | account id
  active: Account | null; // null when "all"
  defaultAccount: Account | undefined;
  currency: string;
  setActiveId: (id: string) => void;
}

const KEY = 'tj_active_account';
const C = createContext<Ctx | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { data: accounts = [] } = useAccounts();
  const [activeId, setActive] = useState(localStorage.getItem(KEY) ?? 'all');

  useEffect(() => {
    if (activeId !== 'all' && accounts.length && !accounts.some((a) => a._id === activeId)) setActive('all');
  }, [accounts, activeId]);

  const value = useMemo<Ctx>(() => {
    const active = accounts.find((a) => a._id === activeId) ?? null;
    const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];
    return {
      accounts,
      activeId: active ? activeId : 'all',
      active,
      defaultAccount,
      currency: (active ?? defaultAccount)?.currency ?? 'USD',
      setActiveId: (id) => { localStorage.setItem(KEY, id); setActive(id); },
    };
  }, [accounts, activeId]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useActiveAccount = () => {
  const c = useContext(C);
  if (!c) throw new Error('useActiveAccount outside provider');
  return c;
};

import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, Plus, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';
import { NAV } from './nav';
import { AccountSwitcher } from './AccountSwitcher';
import { TradeFormModal } from '@/components/trades/TradeFormModal';
import { TradeModalProvider } from '@/components/trades/TradeModalContext';

function SideLink({ to, label, icon: Icon, onClick }: (typeof NAV)[number] & { onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      title={label}
      className={({ isActive }) =>
        cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition md:justify-center lg:justify-start',
          isActive ? 'bg-brand-50 text-brand-600' : 'text-ink-500 hover:bg-ink-100')
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="md:hidden lg:inline">{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const [tradeModal, setTradeModal] = useState<{ open: boolean; tradeId?: string }>({ open: false });

  const openModal = (tradeId?: string) => setTradeModal({ open: true, tradeId });

  return (
    <TradeModalProvider value={{ open: openModal }}>
      <div className="min-h-dvh">
        {/* tablet rail + desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col gap-4 border-r border-ink-100 bg-white/70 p-3 backdrop-blur md:flex lg:w-[260px] lg:p-4">
          <div className="hidden lg:block"><AccountSwitcher /></div>
          <div className="grid h-10 w-10 place-items-center self-center rounded-xl bg-brand-500 font-bold text-white lg:hidden">TJ</div>
          <nav className="flex flex-col gap-1">{NAV.map((n) => <SideLink key={n.to} {...n} />)}</nav>
          <div className="mt-auto flex flex-col gap-2">
            <div className="hidden px-2 text-sm lg:block">
              <p className="truncate font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-ink-500">{user?.email}</p>
            </div>
            <button onClick={logout} title="Log out" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-100 md:justify-center lg:justify-start">
              <LogOut className="h-5 w-5" /> <span className="md:hidden lg:inline">Log out</span>
            </button>
          </div>
        </aside>

        {/* mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-ink-100 bg-ink-50/90 px-3 py-2.5 backdrop-blur md:hidden">
          <button onClick={() => setDrawer(true)} aria-label="Menu" className="rounded-lg p-2 text-ink-700 hover:bg-ink-100"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1"><AccountSwitcher className="!rounded-xl !py-1.5" /></div>
          <button onClick={() => openModal()} aria-label="Log trade" className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white"><Plus className="h-5 w-5" /></button>
        </header>

        {/* drawer (mobile) */}
        {drawer && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-ink-900/40" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-4 bg-white p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">Trading journal</p>
                <button onClick={() => setDrawer(false)} aria-label="Close" className="rounded-lg p-1.5 hover:bg-ink-100"><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex flex-col gap-1">{NAV.map((n) => <SideLink key={n.to} {...n} onClick={() => setDrawer(false)} />)}</nav>
              <div className="mt-auto border-t border-ink-100 pt-3">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="mb-2 truncate text-xs text-ink-500">{user?.email}</p>
                <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-100"><LogOut className="h-5 w-5" /> Log out</button>
              </div>
            </div>
          </div>
        )}

        <main key={pathname} className="px-4 pb-28 pt-5 md:ml-[72px] md:px-6 md:pb-10 md:pt-8 lg:ml-[260px] lg:px-10">
          <div className="mx-auto max-w-6xl"><Outlet /></div>
        </main>

        {/* mobile bottom tabs */}
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-ink-100 bg-white/95 backdrop-blur md:hidden">
          {NAV.filter((n) => n.mobile).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-brand-600' : 'text-ink-400')}>
              <Icon className="h-5 w-5" /> {label}
            </NavLink>
          ))}
        </nav>

        <TradeFormModal open={tradeModal.open} tradeId={tradeModal.tradeId} onClose={() => setTradeModal({ open: false })} />
      </div>
    </TradeModalProvider>
  );
}

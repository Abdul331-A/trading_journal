import { BarChart3, CalendarDays, LayoutDashboard, List, LucideIcon, UploadCloud, Wallet } from 'lucide-react';

export interface NavItem { to: string; label: string; icon: LucideIcon; mobile?: boolean }

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, mobile: true },
  { to: '/trades', label: 'Trade log', icon: List, mobile: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, mobile: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, mobile: true },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/import', label: 'Import', icon: UploadCloud },
];

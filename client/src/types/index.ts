export interface User { id: string; name: string; email: string }

export interface AccountSettings { dailyLossLimitPct: number; riskPerTradePct: number; maxTradesPerDay: number }
export interface Account {
  _id: string;
  name: string;
  broker: string;
  startingBalance: number;
  currency: string;
  isDefault: boolean;
  settings: AccountSettings;
}

export type Direction = 'buy' | 'sell';
export type Session = 'Sydney' | 'Tokyo' | 'London' | 'New York';
export interface Screenshot { url: string; publicId: string }

export interface Trade {
  _id: string;
  account: string | { _id: string; name: string; currency: string };
  symbol: string;
  direction: Direction;
  lotSize: number;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: string;
  exitTime?: string;
  status: 'open' | 'closed';
  session?: Session;
  netPnl?: number;
  commission?: number;
  swap?: number;
  fees?: number;
  riskAmount?: number;
  rMultiple: number;
  setup: string;
  tags: string[];
  emotionBefore: string;
  emotionAfter: string;
  followedPlan: 'yes' | 'no' | 'unrecorded';
  mistakes: string;
  notes: string;
  confidence?: number;
  selfGrade?: number;
  lessons: string;
  screenshots: Screenshot[];
}

export interface TradeList { trades: Trade[]; total: number; page: number; pages: number }

export interface Summary {
  netPnl: number; trades: number; wins: number; losses: number; winRate: number;
  profitFactor: number | null; expectancy: number; avgR: number; best: number; worst: number;
  maxDrawdown: number; maxDrawdownPct: number; longestWinStreak: number; longestLossStreak: number;
}
export interface Row { key: string; trades: number; winRate: number; avgR: number; netPnl: number }
export interface Analytics {
  startingBalance: number;
  currentBalance: number;
  summary: Summary;
  equity: { time: string; equity: number }[];
  rDistribution: { bucket: string; count: number }[];
  bySymbol: Row[]; bySession: Row[]; bySetup: Row[]; byDay: Row[]; byDirection: Row[]; byTag: Row[];
}
export interface CalendarData { days: Record<string, { pnl: number; trades: number }>; total: number; trades: number }
export interface Guardrails {
  limitHit: boolean;
  items: { key: string; label: string; status: 'safe' | 'warn' | 'over' | 'unset'; message: string }[];
}

export type Range = '7d' | '30d' | '90d' | '1y' | 'all';
export interface TradeFilters {
  status?: string; direction?: string; session?: string; setup?: string; tag?: string; symbol?: string;
  from?: string; to?: string; sort?: string; order?: 'asc' | 'desc'; page?: number; limit?: number;
}

import { TradeDoc } from '../models/Trade';

type T = Pick<TradeDoc, 'netPnl' | 'rMultiple' | 'entryTime' | 'symbol' | 'session' | 'setup' | 'direction' | 'tags'>;

export interface Summary {
  netPnl: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number | null;
  expectancy: number;
  avgR: number;
  best: number;
  worst: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  longestWinStreak: number;
  longestLossStreak: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function summarize(trades: T[], startingBalance = 0): Summary {
  const closed = trades
    .filter((t) => t.netPnl != null)
    .sort((a, b) => +new Date(a.entryTime) - +new Date(b.entryTime));
  const pnls = closed.map((t) => t.netPnl as number);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const net = pnls.reduce((a, b) => a + b, 0);

  let peak = startingBalance, equity = startingBalance, maxDD = 0, maxDDPct = 0;
  let winStreak = 0, lossStreak = 0, bestWin = 0, bestLoss = 0;
  for (const p of pnls) {
    equity += p;
    peak = Math.max(peak, equity);
    const dd = peak - equity;
    if (dd > maxDD) {
      maxDD = dd;
      maxDDPct = peak > 0 ? (dd / peak) * 100 : 0;
    }
    if (p > 0) { winStreak++; lossStreak = 0; } else if (p < 0) { lossStreak++; winStreak = 0; } else { winStreak = 0; lossStreak = 0; }
    bestWin = Math.max(bestWin, winStreak);
    bestLoss = Math.max(bestLoss, lossStreak);
  }

  return {
    netPnl: round(net),
    trades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length ? round((wins.length / closed.length) * 100) : 0,
    profitFactor: grossLoss > 0 ? round(grossWin / grossLoss) : null,
    expectancy: closed.length ? round(net / closed.length) : 0,
    avgR: closed.length ? round(closed.reduce((a, t) => a + (t.rMultiple || 0), 0) / closed.length) : 0,
    best: pnls.length ? round(Math.max(...pnls)) : 0,
    worst: pnls.length ? round(Math.min(...pnls)) : 0,
    maxDrawdown: round(maxDD),
    maxDrawdownPct: round(maxDDPct),
    longestWinStreak: bestWin,
    longestLossStreak: bestLoss,
  };
}

export function equityCurve(trades: T[], startingBalance = 0) {
  const closed = trades
    .filter((t) => t.netPnl != null)
    .sort((a, b) => +new Date(a.entryTime) - +new Date(b.entryTime));
  let eq = startingBalance;
  const points = [{ time: closed[0]?.entryTime ?? new Date(), equity: round(eq) }];
  // starting point sits just before first trade so single-trade curves still draw a line
  if (closed.length) points[0].time = new Date(+new Date(closed[0].entryTime) - 1);
  for (const t of closed) {
    eq += t.netPnl as number;
    points.push({ time: t.entryTime, equity: round(eq) });
  }
  return points;
}

export interface Row {
  key: string;
  trades: number;
  winRate: number;
  avgR: number;
  netPnl: number;
}

export function groupBy(trades: T[], keyFn: (t: T) => string | string[] | undefined): Row[] {
  const map = new Map<string, T[]>();
  for (const t of trades) {
    if (t.netPnl == null) continue;
    const keys = keyFn(t);
    for (const k of ([] as string[]).concat(keys ?? [])) {
      if (!k) continue;
      map.set(k, [...(map.get(k) ?? []), t]);
    }
  }
  return [...map.entries()]
    .map(([key, list]) => {
      const s = summarize(list);
      return { key, trades: s.trades, winRate: s.winRate, avgR: s.avgR, netPnl: s.netPnl };
    })
    .sort((a, b) => b.netPnl - a.netPnl);
}

const BUCKETS = ['≤ -3R', '-3 to -2R', '-2 to -1R', '-1 to 0R', '0 to +1R', '+1 to +2R', '+2 to +3R', '≥ +3R'];

export function rDistribution(trades: T[]) {
  const counts = new Array(BUCKETS.length).fill(0);
  for (const t of trades) {
    if (t.netPnl == null) continue;
    const r = t.rMultiple || 0;
    let i: number;
    if (r <= -3) i = 0;
    else if (r < -2) i = 1;
    else if (r < -1) i = 2;
    else if (r < 0) i = 3;
    else if (r < 1) i = 4;
    else if (r < 2) i = 5;
    else if (r < 3) i = 6;
    else i = 7;
    counts[i]++;
  }
  return BUCKETS.map((bucket, i) => ({ bucket, count: counts[i] }));
}

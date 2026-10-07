import { Request, Response } from 'express';
import { Trade } from '../models/Trade';
import { asyncHandler } from '../utils/asyncHandler';
import { rangeStart, resolveScope } from '../utils/scope';
import { equityCurve, groupBy, rDistribution, summarize } from '../services/stats.service';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const analytics = asyncHandler(async (req: Request, res: Response) => {
  const { filter, startingBalance } = await resolveScope(req.userId, req.query.account as string | undefined);
  const from = rangeStart(req.query.range as string | undefined);
  const where = { ...filter, status: 'closed', ...(from && { entryTime: { $gte: from } }) };
  const trades = await Trade.find(where).lean();

  const summary = summarize(trades, startingBalance);
  const closedAll = await Trade.countDocuments({ ...filter, status: 'closed' });
  res.json({
    startingBalance,
    currentBalance: Math.round((startingBalance + (await allTimePnl(filter))) * 100) / 100,
    hasTradesOutsideRange: closedAll > trades.length,
    summary,
    equity: equityCurve(trades, 0),
    rDistribution: rDistribution(trades),
    bySymbol: groupBy(trades, (t) => t.symbol),
    bySession: groupBy(trades, (t) => t.session),
    bySetup: groupBy(trades, (t) => t.setup),
    byDay: groupBy(trades, (t) => DAYS[new Date(t.entryTime).getUTCDay()]),
    byDirection: groupBy(trades, (t) => (t.direction === 'buy' ? 'Long' : 'Short')),
    byTag: groupBy(trades, (t) => t.tags),
  });
});

async function allTimePnl(filter: Record<string, unknown>) {
  const [r] = await Trade.aggregate([{ $match: { ...filter, status: 'closed' } }, { $group: { _id: null, pnl: { $sum: '$netPnl' } } }]);
  return r?.pnl ?? 0;
}

/** Daily P&L for a month. `month` = YYYY-MM, `offset` = client tz offset in minutes (Date#getTimezoneOffset). */
export const calendar = asyncHandler(async (req: Request, res: Response) => {
  const { filter } = await resolveScope(req.userId, req.query.account as string | undefined);
  const [y, m] = String(req.query.month ?? new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const offset = Number(req.query.offset ?? 0);
  const start = new Date(Date.UTC(y, m - 1, 1) + offset * 60_000);
  const end = new Date(Date.UTC(y, m, 1) + offset * 60_000);
  const trades = await Trade.find({ ...filter, status: 'closed', entryTime: { $gte: start, $lt: end } }, 'entryTime netPnl').lean();

  const days: Record<string, { pnl: number; trades: number }> = {};
  for (const t of trades) {
    const local = new Date(+new Date(t.entryTime) - offset * 60_000);
    const key = local.toISOString().slice(0, 10);
    days[key] ??= { pnl: 0, trades: 0 };
    days[key].pnl = Math.round((days[key].pnl + (t.netPnl ?? 0)) * 100) / 100;
    days[key].trades++;
  }
  const total = Object.values(days).reduce((s, d) => s + d.pnl, 0);
  res.json({ days, total: Math.round(total * 100) / 100, trades: trades.length });
});

type Status = 'safe' | 'warn' | 'over' | 'unset';

/** Guardrails for "today". Client passes `from` = local midnight as ISO. */
export const guardrails = asyncHandler(async (req: Request, res: Response) => {
  const { filter, accounts } = await resolveScope(req.userId, req.query.account as string | undefined);
  const acc = accounts.find((a) => a.isDefault) ?? accounts[0];
  const startingBalance = accounts.length === 1 ? acc.startingBalance : accounts.reduce((s, a) => s + a.startingBalance, 0);
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().setHours(0, 0, 0, 0));
  const today = await Trade.find({ ...filter, entryTime: { $gte: from } }).lean();
  const s = acc.settings;

  const loss = Math.abs(Math.min(0, today.reduce((a, t) => a + (t.netPnl ?? 0), 0)));
  const items: { key: string; label: string; status: Status; message: string }[] = [];

  if (startingBalance > 0) {
    const limit = (startingBalance * s.dailyLossLimitPct) / 100;
    const status: Status = loss >= limit ? 'over' : loss >= limit * 0.7 ? 'warn' : 'safe';
    items.push({ key: 'daily', label: 'Daily loss guard', status, message: `Lost ${loss.toFixed(2)} of ${limit.toFixed(2)} allowed today.` });
    const maxRisk = (startingBalance * s.riskPerTradePct) / 100;
    const worst = Math.max(0, ...today.map((t) => t.riskAmount ?? 0));
    items.push({ key: 'risk', label: 'Risk per trade', status: worst > maxRisk ? 'over' : worst > maxRisk * 0.8 ? 'warn' : 'safe', message: worst ? `Biggest risk today ${worst.toFixed(2)}, limit ${maxRisk.toFixed(2)}.` : `Limit ${maxRisk.toFixed(2)} per trade.` });
  } else {
    const msg = 'Set a starting balance on your account to enable this.';
    items.push({ key: 'daily', label: 'Daily loss guard', status: 'unset', message: msg });
    items.push({ key: 'risk', label: 'Risk per trade', status: 'unset', message: msg });
  }
  items.splice(1, 0, {
    key: 'overtrading',
    label: 'Overtrading scanner',
    status: today.length > s.maxTradesPerDay ? 'over' : today.length === s.maxTradesPerDay ? 'warn' : 'safe',
    message: `${today.length} of ${s.maxTradesPerDay} trades taken today.`,
  });
  res.json({ items, limitHit: items.some((i) => i.status === 'over') });
});

import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import { Account } from '../models/Account';
import { Trade, TradeDoc } from '../models/Trade';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { deriveTradeFields } from '../services/trade.service';
import { destroyAssets } from '../services/upload.service';
import { TradeInput } from '../validators';
import { resolveScope } from '../utils/scope';

async function buildPayload(userId: string, input: TradeInput) {
  const account = await Account.findOne({ _id: input.account, user: userId });
  if (!account) throw ApiError.badRequest('Account not found');
  const { riskAmount: riskOverride, ...rest } = input;
  const derived = deriveTradeFields({
    symbol: input.symbol.toUpperCase(),
    lotSize: input.lotSize,
    entryPrice: input.entryPrice,
    stopLoss: input.stopLoss,
    entryTime: input.entryTime,
    netPnl: input.netPnl,
    riskOverride,
    riskAmount: undefined,
  });
  return { ...rest, ...derived, user: userId };
}

export const listTrades = asyncHandler(async (req: Request, res: Response) => {
  const q = res.locals.query;
  const { filter } = await resolveScope(req.userId, q.account);
  const where: FilterQuery<TradeDoc> = { ...filter };
  if (q.status) where.status = q.status;
  if (q.direction) where.direction = q.direction;
  if (q.session) where.session = q.session;
  if (q.setup) where.setup = q.setup;
  if (q.tag) where.tags = q.tag;
  if (q.symbol) where.symbol = new RegExp(`^${String(q.symbol).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  if (q.from || q.to) where.entryTime = { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) };

  const [trades, total] = await Promise.all([
    Trade.find(where)
      .sort({ [q.sort]: q.order === 'asc' ? 1 : -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('account', 'name currency')
      .lean(),
    Trade.countDocuments(where),
  ]);
  res.json({ trades, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
});

export const filterOptions = asyncHandler(async (req: Request, res: Response) => {
  const { filter } = await resolveScope(req.userId, req.query.account as string | undefined);
  const [setups, tags] = await Promise.all([Trade.distinct('setup', { ...filter, setup: { $ne: '' } }), Trade.distinct('tags', filter)]);
  res.json({ setups: setups.sort(), tags: tags.sort() });
});

export const getTrade = asyncHandler(async (req: Request, res: Response) => {
  const trade = await Trade.findOne({ _id: req.params.id, user: req.userId }).lean();
  if (!trade) throw ApiError.notFound('Trade not found');
  res.json({ trade });
});

export const createTrade = asyncHandler(async (req: Request, res: Response) => {
  const trade = await Trade.create(await buildPayload(req.userId, req.body));
  res.status(201).json({ trade });
});

export const updateTrade = asyncHandler(async (req: Request, res: Response) => {
  const existing = await Trade.findOne({ _id: req.params.id, user: req.userId });
  if (!existing) throw ApiError.notFound('Trade not found');
  const payload = await buildPayload(req.userId, req.body);
  // remove screenshots that were dropped in the edit
  const keep = new Set((payload.screenshots ?? []).map((s) => s.publicId));
  await destroyAssets(existing.screenshots.map((s) => s.publicId).filter((id) => !keep.has(id)));
  existing.set({ ...payload, $unset: undefined });
  // clear optional numeric fields the user emptied
  for (const k of ['entryPrice', 'exitPrice', 'stopLoss', 'takeProfit', 'netPnl', 'exitTime', 'confidence', 'selfGrade'] as const) {
    if ((payload as Record<string, unknown>)[k] === undefined) existing.set(k, undefined);
  }
  await existing.save();
  res.json({ trade: existing });
});

export const deleteTrade = asyncHandler(async (req: Request, res: Response) => {
  const trade = await Trade.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!trade) throw ApiError.notFound('Trade not found');
  await destroyAssets(trade.screenshots.map((s) => s.publicId));
  res.json({ ok: true });
});

export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const ids: string[] = Array.isArray(req.body.ids) ? req.body.ids : [];
  const trades = await Trade.find({ _id: { $in: ids }, user: req.userId }, 'screenshots').lean();
  await destroyAssets(trades.flatMap((t) => t.screenshots.map((s) => s.publicId)));
  const r = await Trade.deleteMany({ _id: { $in: ids }, user: req.userId });
  res.json({ deleted: r.deletedCount });
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const { filter } = await resolveScope(req.userId, req.query.account as string | undefined);
  const trades = await Trade.find(filter).sort({ entryTime: -1 }).lean();
  const cols = ['entryTime', 'symbol', 'direction', 'lotSize', 'entryPrice', 'exitPrice', 'stopLoss', 'takeProfit', 'status', 'session', 'netPnl', 'rMultiple', 'setup', 'tags', 'notes'] as const;
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.join('|') : v instanceof Date ? v.toISOString() : String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...trades.map((t) => cols.map((c) => esc(t[c])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="trades.csv"');
  res.send(csv);
});

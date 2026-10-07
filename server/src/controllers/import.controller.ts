import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { Trade } from '../models/Trade';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { parseTradesCsv } from '../services/import.service';
import { deriveTradeFields } from '../services/trade.service';

export const importTrades = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file sent');
  const account = await Account.findOne({ _id: req.body.account, user: req.userId });
  if (!account) throw ApiError.badRequest('Pick an account to import into');

  let parsed;
  try {
    parsed = parseTradesCsv(req.file.buffer);
  } catch {
    throw ApiError.badRequest('Could not read that file. Upload a CSV export.');
  }
  if (!parsed.rows.length) throw ApiError.badRequest('No trades found. Check the column headers.');

  const ids = parsed.rows.map((r) => r.externalId);
  const existing = new Set((await Trade.find({ account: account._id, externalId: { $in: ids } }, 'externalId').lean()).map((t) => t.externalId));
  const fresh = parsed.rows.filter((r) => !existing.has(r.externalId));

  const docs = fresh.map((r) => ({
    ...r,
    user: req.userId,
    account: account._id,
    ...deriveTradeFields({ ...r, riskAmount: undefined }),
  }));
  if (docs.length) await Trade.insertMany(docs, { ordered: false });
  res.json({ imported: docs.length, duplicates: parsed.rows.length - docs.length, skipped: parsed.skipped });
});

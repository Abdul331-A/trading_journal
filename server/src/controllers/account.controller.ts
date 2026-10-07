import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { Trade } from '../models/Trade';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { destroyAssets } from '../services/upload.service';

export const listAccounts = asyncHandler(async (req: Request, res: Response) => {
  const accounts = await Account.find({ user: req.userId }).sort({ isDefault: -1, createdAt: 1 });
  res.json({ accounts });
});

async function makeOnlyDefault(userId: string, id: unknown) {
  await Account.updateMany({ user: userId, _id: { $ne: id } }, { isDefault: false });
}

export const createAccount = asyncHandler(async (req: Request, res: Response) => {
  const count = await Account.countDocuments({ user: req.userId });
  const account = await Account.create({ ...req.body, user: req.userId, isDefault: count === 0 || req.body.isDefault });
  if (account.isDefault) await makeOnlyDefault(req.userId, account._id);
  res.status(201).json({ account });
});

export const updateAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await Account.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true });
  if (!account) throw ApiError.notFound('Account not found');
  if (req.body.isDefault) await makeOnlyDefault(req.userId, account._id);
  res.json({ account });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const total = await Account.countDocuments({ user: req.userId });
  if (total <= 1) throw ApiError.badRequest('You need at least one account');
  const account = await Account.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!account) throw ApiError.notFound('Account not found');
  const trades = await Trade.find({ account: account._id }, 'screenshots').lean();
  await destroyAssets(trades.flatMap((t) => t.screenshots.map((s) => s.publicId)));
  await Trade.deleteMany({ account: account._id });
  if (account.isDefault) {
    const next = await Account.findOne({ user: req.userId }).sort({ createdAt: 1 });
    if (next) await Account.updateOne({ _id: next._id }, { isDefault: true });
  }
  res.json({ ok: true });
});

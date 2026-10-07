import { Types } from 'mongoose';
import { Account } from '../models/Account';
import { ApiError } from './ApiError';

/** Resolve an `account` query value ("all" | id | undefined) into a Mongo filter + starting balance. */
export async function resolveScope(userId: string, accountParam?: string) {
  const accounts = await Account.find({ user: userId }).lean();
  if (!accountParam || accountParam === 'all') {
    return {
      filter: { user: new Types.ObjectId(userId) } as Record<string, unknown>,
      startingBalance: accounts.reduce((s, a) => s + a.startingBalance, 0),
      accounts,
    };
  }
  if (!Types.ObjectId.isValid(accountParam)) throw ApiError.badRequest('Invalid account');
  const acc = accounts.find((a) => String(a._id) === accountParam);
  if (!acc) throw ApiError.notFound('Account not found');
  return {
    filter: { user: new Types.ObjectId(userId), account: acc._id } as Record<string, unknown>,
    startingBalance: acc.startingBalance,
    accounts: [acc],
  };
}

export function rangeStart(range?: string): Date | undefined {
  const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const d = range ? days[range.toLowerCase()] : undefined;
  return d ? new Date(Date.now() - d * 86_400_000) : undefined;
}

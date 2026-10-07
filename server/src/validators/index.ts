import { z } from 'zod';

const emptyToUndef = (v: unknown) => (v === '' || v === null ? undefined : v);
const optNum = z.preprocess(emptyToUndef, z.coerce.number().optional());
const optStr = z.preprocess(emptyToUndef, z.string().trim().optional());

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(60),
  email: z.string().trim().email('Valid email required'),
  password: z.string().min(8, 'Password must be 8+ characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(60),
  broker: z.string().trim().max(60).optional().default(''),
  startingBalance: z.coerce.number().min(0).default(0),
  currency: z.string().trim().length(3).default('USD'),
  isDefault: z.boolean().optional(),
  settings: z
    .object({
      dailyLossLimitPct: z.coerce.number().min(0).max(100),
      riskPerTradePct: z.coerce.number().min(0).max(100),
      maxTradesPerDay: z.coerce.number().int().min(1).max(500),
    })
    .optional(),
});

export const tradeSchema = z.object({
  account: z.string().min(1, 'Account required'),
  symbol: z.string().trim().min(1, 'Symbol required').max(20),
  direction: z.enum(['buy', 'sell']),
  lotSize: z.coerce.number().positive('Lot size must be above 0'),
  entryTime: z.coerce.date(),
  exitTime: z.preprocess(emptyToUndef, z.coerce.date().optional()),
  entryPrice: optNum,
  exitPrice: optNum,
  stopLoss: optNum,
  takeProfit: optNum,
  netPnl: optNum,
  commission: optNum,
  swap: optNum,
  fees: optNum,
  riskAmount: optNum,
  confidence: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).max(5).optional()),
  selfGrade: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).max(5).optional()),
  setup: optStr,
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
  emotionBefore: optStr,
  emotionAfter: optStr,
  followedPlan: z.enum(['yes', 'no', 'unrecorded']).optional(),
  mistakes: optStr,
  notes: optStr,
  lessons: optStr,
  screenshots: z.array(z.object({ url: z.string().url(), publicId: z.string() })).max(6).optional(),
});

export type TradeInput = z.infer<typeof tradeSchema>;

export const tradeQuerySchema = z.object({
  account: z.string().optional(),
  status: z.enum(['open', 'closed']).optional(),
  direction: z.enum(['buy', 'sell']).optional(),
  session: z.string().optional(),
  setup: z.string().optional(),
  tag: z.string().optional(),
  symbol: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(['entryTime', 'netPnl', 'rMultiple', 'symbol']).default('entryTime'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(25),
});

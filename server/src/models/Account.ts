import { Schema, model, Types } from 'mongoose';

const accountSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    broker: { type: String, trim: true, default: '' },
    startingBalance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    isDefault: { type: Boolean, default: false },
    settings: {
      dailyLossLimitPct: { type: Number, default: 3 },
      riskPerTradePct: { type: Number, default: 1 },
      maxTradesPerDay: { type: Number, default: 5 },
    },
  },
  { timestamps: true },
);

export interface AccountDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  broker: string;
  startingBalance: number;
  currency: string;
  isDefault: boolean;
  settings: { dailyLossLimitPct: number; riskPerTradePct: number; maxTradesPerDay: number };
}

export const Account = model<AccountDoc>('Account', accountSchema);

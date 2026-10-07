import { Schema, model, Types } from 'mongoose';

export type Session = 'Sydney' | 'Tokyo' | 'London' | 'New York';

const tradeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    direction: { type: String, enum: ['buy', 'sell'], required: true },
    lotSize: { type: Number, required: true, min: 0 },
    entryPrice: { type: Number },
    exitPrice: { type: Number },
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    entryTime: { type: Date, required: true, index: true },
    exitTime: { type: Date },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    session: { type: String, enum: ['Sydney', 'Tokyo', 'London', 'New York'] },
    netPnl: { type: Number },
    commission: { type: Number, default: 0 },
    swap: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    riskAmount: { type: Number },
    rMultiple: { type: Number, default: 0 },
    setup: { type: String, trim: true, default: '' },
    tags: { type: [String], default: [] },
    emotionBefore: { type: String, default: '' },
    emotionAfter: { type: String, default: '' },
    followedPlan: { type: String, enum: ['yes', 'no', 'unrecorded'], default: 'unrecorded' },
    mistakes: { type: String, default: '' },
    notes: { type: String, default: '' },
    confidence: { type: Number, min: 1, max: 5 },
    selfGrade: { type: Number, min: 1, max: 5 },
    lessons: { type: String, default: '' },
    screenshots: {
      type: [{ url: String, publicId: String, _id: false }],
      default: [],
    },
    externalId: { type: String },
  },
  { timestamps: true },
);

tradeSchema.index({ user: 1, account: 1, externalId: 1 }, { unique: true, sparse: true });
tradeSchema.index({ user: 1, entryTime: -1 });

export interface TradeDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  account: Types.ObjectId;
  symbol: string;
  direction: 'buy' | 'sell';
  lotSize: number;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: Date;
  exitTime?: Date;
  status: 'open' | 'closed';
  session?: Session;
  netPnl?: number;
  commission: number;
  swap: number;
  fees: number;
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
  screenshots: { url: string; publicId: string }[];
  externalId?: string;
}

export const Trade = model<TradeDoc>('Trade', tradeSchema);

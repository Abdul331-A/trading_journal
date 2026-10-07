import { Session, TradeDoc } from '../models/Trade';

/** Session by UTC hour. Tweak ranges to taste. */
export function getSession(date: Date): Session {
  const h = date.getUTCHours();
  if (h >= 0 && h < 7) return 'Tokyo';
  if (h >= 7 && h < 12) return 'London';
  if (h >= 12 && h < 21) return 'New York';
  return 'Sydney';
}

function contractSize(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.startsWith('XAU')) return 100;
  if (s.startsWith('XAG')) return 5000;
  if (/BTC|ETH/.test(s)) return 1;
  if (/US30|NAS|SPX|DAX|GER|UK100|NDX/.test(s)) return 1;
  return 100000;
}

/** Rough USD risk estimate from stop distance. Users can override with riskAmount. */
export function estimateRisk(
  symbol: string,
  lotSize: number,
  entry?: number,
  stop?: number,
): number | undefined {
  if (entry == null || stop == null || !lotSize) return undefined;
  const dist = Math.abs(entry - stop);
  let risk = dist * lotSize * contractSize(symbol);
  if (symbol.toUpperCase().endsWith('JPY') && entry) risk = risk / entry;
  return Math.round(risk * 100) / 100;
}

type Derivable = Pick<
  TradeDoc,
  'symbol' | 'lotSize' | 'entryPrice' | 'stopLoss' | 'entryTime' | 'netPnl' | 'riskAmount'
> & { riskOverride?: number };

/** Fields that are always derived from user input. */
export function deriveTradeFields(t: Derivable) {
  const status: 'open' | 'closed' = t.netPnl != null ? 'closed' : 'open';
  const riskAmount = t.riskOverride ?? estimateRisk(t.symbol, t.lotSize, t.entryPrice, t.stopLoss);
  const rMultiple =
    status === 'closed' && riskAmount && riskAmount > 0
      ? Math.round(((t.netPnl as number) / riskAmount) * 100) / 100
      : 0;
  return { status, riskAmount, rMultiple, session: getSession(t.entryTime) };
}

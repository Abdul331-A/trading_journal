import { parse } from 'csv-parse/sync';

export interface ParsedRow {
  symbol: string;
  direction: 'buy' | 'sell';
  lotSize: number;
  entryTime: Date;
  exitTime?: Date;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  commission: number;
  swap: number;
  netPnl?: number;
  externalId: string;
}

const ALIASES: Record<string, string[]> = {
  symbol: ['symbol', 'instrument', 'pair', 'item', 'market'],
  side: ['type', 'side', 'direction', 'action'],
  lots: ['volume', 'lots', 'lot', 'size', 'quantity', 'qty'],
  openTime: ['open time', 'opentime', 'open_time', 'entry time', 'time', 'date', 'opened'],
  closeTime: ['close time', 'closetime', 'close_time', 'exit time', 'closed'],
  openPrice: ['open price', 'openprice', 'open_price', 'entry price', 'entry', 'price'],
  closePrice: ['close price', 'closeprice', 'close_price', 'exit price', 'exit'],
  sl: ['s / l', 's/l', 'sl', 'stop loss', 'stoploss'],
  tp: ['t / p', 't/p', 'tp', 'take profit', 'takeprofit'],
  profit: ['profit', 'net p&l', 'net pnl', 'pnl', 'p&l', 'net profit', 'realized p&l'],
  commission: ['commission', 'fee', 'fees'],
  swap: ['swap', 'rollover'],
  id: ['ticket', 'order', 'position', 'deal', 'id', 'position id', 'order id'],
};

function parseDate(v?: string): Date | undefined {
  if (!v) return undefined;
  const s = v.trim().replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3').replace(' ', 'T');
  const d = new Date(/Z|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`);
  return Number.isNaN(+d) ? undefined : d;
}

const num = (v?: string): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(String(v).replace(/[\s,$]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

export function parseTradesCsv(buffer: Buffer): { rows: ParsedRow[]; skipped: number } {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const delimiter = text.split('\n', 1)[0].includes(';') ? ';' : text.split('\n', 1)[0].includes('\t') ? '\t' : ',';
  const records: Record<string, string>[] = parse(text, {
    columns: (h: string[]) => h.map((x) => x.trim().toLowerCase()),
    skip_empty_lines: true,
    relax_column_count: true,
    delimiter,
    trim: true,
  });

  const pick = (rec: Record<string, string>, key: string) => {
    for (const a of ALIASES[key]) if (rec[a] !== undefined && rec[a] !== '') return rec[a];
    return undefined;
  };

  const rows: ParsedRow[] = [];
  let skipped = 0;
  for (const rec of records) {
    const side = pick(rec, 'side')?.toLowerCase();
    const direction = side?.startsWith('buy') || side === 'long' ? 'buy' : side?.startsWith('sell') || side === 'short' ? 'sell' : null;
    const symbol = pick(rec, 'symbol');
    const entryTime = parseDate(pick(rec, 'openTime'));
    const lotSize = num(pick(rec, 'lots'));
    if (!direction || !symbol || !entryTime || lotSize == null) { skipped++; continue; }
    const id = pick(rec, 'id') ?? `${symbol}|${entryTime.toISOString()}|${direction}|${lotSize}`;
    rows.push({
      symbol: symbol.toUpperCase(),
      direction,
      lotSize,
      entryTime,
      exitTime: parseDate(pick(rec, 'closeTime')),
      entryPrice: num(pick(rec, 'openPrice')),
      exitPrice: num(pick(rec, 'closePrice')),
      stopLoss: num(pick(rec, 'sl')),
      takeProfit: num(pick(rec, 'tp')),
      commission: num(pick(rec, 'commission')) ?? 0,
      swap: num(pick(rec, 'swap')) ?? 0,
      netPnl: num(pick(rec, 'profit')),
      externalId: String(id),
    });
  }
  return { rows, skipped };
}

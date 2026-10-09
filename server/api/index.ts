import type { IncomingMessage, ServerResponse } from 'http';
import app from '../src/app';
import { connectDB } from '../src/config/db';

let ready: Promise<void> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  ready ??= connectDB();
  try {
    await ready;
  } catch {
    ready = null;
    res.statusCode = 500;
    res.end('Database connection failed');
    return;
  }
  return (app as any)(req, res);
}